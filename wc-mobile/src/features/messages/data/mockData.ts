/**
 * Messages Mock Data
 */

import { User } from "../model/types";

// Legacy mock message type for backwards compatibility
interface LegacyMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

// Legacy mock conversation type for backwards compatibility
interface LegacyConversation {
  id: string;
  participants: User[];
  lastMessage?: LegacyMessage;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export const currentUser: User = {
  id: "current-user",
  name: "Me",
  avatar: undefined,
};

export const mockUsers: User[] = [
  {
    id: "u1",
    name: "Mamadou Diallo",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    isOnline: true,
  },
  {
    id: "u2",
    name: "Fatoumata Camara",
    avatar: "https://randomuser.me/api/portraits/women/2.jpg",
    isOnline: false,
  },
  {
    id: "u3",
    name: "Transport Express GN",
    avatar: "https://randomuser.me/api/portraits/men/10.jpg",
    isOnline: true,
  },
  {
    id: "u4",
    name: "Ibrahima Bah",
    avatar: "https://randomuser.me/api/portraits/men/3.jpg",
    isOnline: false,
  },
];

export const mockConversations: LegacyConversation[] = [
  {
    id: "conv-u1",
    participants: [currentUser, mockUsers[0]],
    lastMessage: {
      id: "m1",
      conversationId: "conv-u1",
      senderId: "u1",
      content:
        "Bonjour ! Oui, je suis toujours disponible pour l'échange. On peut se voir ce weekend si ça vous convient.",
      createdAt: "2026-01-20T10:30:00Z",
      isRead: false,
    },
    unreadCount: 2,
    createdAt: "2026-01-18T08:00:00Z",
    updatedAt: "2026-01-20T10:30:00Z",
  },
  {
    id: "conv-u3",
    participants: [currentUser, mockUsers[2]],
    lastMessage: {
      id: "m2",
      conversationId: "conv-u3",
      senderId: "current-user",
      content:
        "D'accord, merci pour les informations. Je vous recontacte la semaine prochaine.",
      createdAt: "2026-01-19T15:45:00Z",
      isRead: true,
    },
    unreadCount: 0,
    createdAt: "2026-01-17T12:00:00Z",
    updatedAt: "2026-01-19T15:45:00Z",
  },
  {
    id: "conv-u2",
    participants: [currentUser, mockUsers[1]],
    lastMessage: {
      id: "m3",
      conversationId: "conv-u2",
      senderId: "u2",
      content: "Je vous envoie les détails du colis demain.",
      createdAt: "2026-01-18T18:20:00Z",
      isRead: true,
    },
    unreadCount: 0,
    createdAt: "2026-01-16T09:00:00Z",
    updatedAt: "2026-01-18T18:20:00Z",
  },
  {
    id: "conv-u4",
    participants: [currentUser, mockUsers[3]],
    lastMessage: {
      id: "m4",
      conversationId: "conv-u4",
      senderId: "u4",
      content: "Le taux proposé me convient. Quand êtes-vous disponible ?",
      createdAt: "2026-01-15T14:10:00Z",
      isRead: true,
    },
    unreadCount: 0,
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-01-15T14:10:00Z",
  },
];

// Mock messages for a conversation
export const getMockMessages = (conversationId: string): LegacyMessage[] => {
  const baseMessages: LegacyMessage[] = [
    {
      id: `${conversationId}-m1`,
      conversationId,
      senderId: "current-user",
      content:
        "Bonjour ! J'ai vu votre offre de change EUR -> GNF. Est-ce que c'est toujours disponible ?",
      createdAt: "2026-01-18T09:00:00Z",
      isRead: true,
    },
    {
      id: `${conversationId}-m2`,
      conversationId,
      senderId: conversationId.replace("conv-", ""),
      content:
        "Bonjour ! Oui, toujours disponible. Quel montant vous intéresse ?",
      createdAt: "2026-01-18T09:15:00Z",
      isRead: true,
    },
    {
      id: `${conversationId}-m3`,
      conversationId,
      senderId: "current-user",
      content: "Je cherche à échanger 500€. Quel est votre taux actuel ?",
      createdAt: "2026-01-18T09:30:00Z",
      isRead: true,
    },
    {
      id: `${conversationId}-m4`,
      conversationId,
      senderId: conversationId.replace("conv-", ""),
      content:
        "Pour 500€, je peux faire 1€ = 10,500 GNF. Soit 5,250,000 GNF au total.",
      createdAt: "2026-01-18T10:00:00Z",
      isRead: true,
    },
    {
      id: `${conversationId}-m5`,
      conversationId,
      senderId: "current-user",
      content: "Le taux me convient. On peut se voir quand ?",
      createdAt: "2026-01-19T14:00:00Z",
      isRead: true,
    },
    {
      id: `${conversationId}-m6`,
      conversationId,
      senderId: conversationId.replace("conv-", ""),
      content:
        "Bonjour ! Oui, je suis toujours disponible pour l'échange. On peut se voir ce weekend si ça vous convient.",
      createdAt: "2026-01-20T10:30:00Z",
      isRead: false,
    },
  ];

  return baseMessages;
};
