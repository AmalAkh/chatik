// User interface
export interface User {
  nickname: string
}

// Interface for a single message in a channel
export interface ChannelMessage {
  id: number
  text: string
  local: boolean
  userId: number
  channelId: number
  date: Date
  sender: User
}

// Interface for a chat channel
export interface Channel {
  id: number
  name: string
  isPrivate: boolean
  ownerId: number
  sender: User
  lastMessage: ChannelMessage | null
}
