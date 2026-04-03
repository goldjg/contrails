export interface Conference {
  id: string
  name: string
  location: string
  country: string
  startDate: string
  endDate: string
  description: string
  topics: string[]
  website?: string
}

export interface Attendance {
  conferenceId: string
  userId: string
  userName: string
  userAvatar: string
}
