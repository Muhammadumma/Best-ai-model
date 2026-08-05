import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { ChatSession, ChatMessage } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
}

export async function saveSessionToFirestore(userId: string, session: ChatSession) {
  try {
    const sessionRef = doc(db, 'chat_sessions', session.id);
    await setDoc(
      sessionRef,
      {
        userId,
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
      { merge: true }
    );

    // Save messages
    for (const msg of session.messages) {
      if (!msg.isStreaming && !msg.isError) {
        const msgRef = doc(db, 'chat_messages', msg.id);
        await setDoc(
          msgRef,
          {
            sessionId: session.id,
            userId,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            provider: msg.provider || 'gemini',
          },
          { merge: true }
        );
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `chat_sessions/${session.id}`);
  }
}

export async function deleteSessionFromFirestore(userId: string, sessionId: string) {
  try {
    await deleteDoc(doc(db, 'chat_sessions', sessionId));
    const q = query(
      collection(db, 'chat_messages'),
      where('sessionId', '==', sessionId),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    const promises = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(promises);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `chat_sessions/${sessionId}`);
  }
}

export async function loadUserSessionsFromFirestore(userId: string): Promise<ChatSession[]> {
  try {
    const qSessions = query(collection(db, 'chat_sessions'), where('userId', '==', userId));
    const snapSessions = await getDocs(qSessions);
    if (snapSessions.empty) return [];

    const sessions: ChatSession[] = [];
    for (const sDoc of snapSessions.docs) {
      const sData = sDoc.data();
      const qMsgs = query(
        collection(db, 'chat_messages'),
        where('sessionId', '==', sDoc.id),
        where('userId', '==', userId)
      );
      const snapMsgs = await getDocs(qMsgs);
      const messages: ChatMessage[] = snapMsgs.docs.map((mDoc) => {
        const mData = mDoc.data();
        return {
          id: mDoc.id,
          role: mData.role,
          content: mData.content,
          timestamp: mData.timestamp,
          provider: mData.provider,
        };
      });

      messages.sort((a, b) => Number(a.id) - Number(b.id));

      sessions.push({
        id: sDoc.id,
        title: sData.title,
        messages: messages,
        createdAt: sData.createdAt,
        updatedAt: sData.updatedAt,
      });
    }

    sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return sessions;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'chat_sessions');
    return [];
  }
}
