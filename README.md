# Checklist: Chat Application Features

## User

* [x] User registration
* [x] User login
* [ ] User logout
* [x] User has:

  * [x] first name and last name
  * [x] unique nickname
  * [x] unique email

---

## Channels

* [x] User can see the list of channels they are a member of
* [x] When leaving or being removed from a channel, it is removed from the list
* [ ] When invited to a channel, the channel is highlighted and pinned to the top
* [x] Through the UI, the user can:

  * [x] create a channel
  * [x] leave a channel
  * [ ] delete a channel if they are an admin

### Channel Types

* [x] Public channel
* [x] Private channel

### Channel Administrator

* [x] The creator of the channel becomes its admin
* [ ] Admin can delete the channel using `/quit`
* [ ] If the admin leaves the channel using `/cancel`, the channel is deleted

### Inactive Channels

* [ ] If a channel has no new messages for more than 30 days, it is automatically deleted
* [ ] The same channel name can then be reused

---

## Command Line

* [ ] A channel can be created using `/join channelName [private]`
* [ ] For private channels:

  * [ ] Invite a user with `/invite nickName` (admin only)
  * [ ] Remove a user with `/revoke nickName` (admin only)
* [ ] For public channels:

  * [ ] Join using `/join channelName` (automatically creates the channel if it doesn’t exist)
  * [ ] Invite another user using `/invite nickName`
  * [ ] Kick a member using `/kick nickName`
* [ ] If three members use `/kick nickName`, the user gets a permanent ban
* [ ] Admin can kick or unban a user at any time
* [ ] A user can leave a channel with `/cancel`

---

## Messages

* [x] User can send messages only in channels they are a member of
* [ ] A message can be addressed to a specific user using `@nickname`

  * [ ] Such messages are highlighted for that user
* [x] User can view the full message history

  * [x] Infinite scroll implemented

---

## Notifications

* [ ] User receives notifications for new messages
* [ ] Notifications appear only when the app is not in the "visible" state
* [ ] Notifications contain part of the message and the sender’s name
* [ ] User can choose to receive notifications only for messages addressed to them
* [ ] When in DND mode, no notifications are received

---

## User Status

* [x] Possible statuses:

  * [x] online
  * [x] DND
  * [x] offline
* [x] Status is visible to other users
* [x] When offline:

  * [x] Messages are not delivered
  * [x] When switching back to online, channels are automatically updated

---

## Channel Members

* [ ] User can view the list of members with `/list`
* [x] If the user is a member, they can see other members

---

## Real-Time Typing

* [ ] If a user has an active channel open, they can see who is currently typing
* [ ] Clicking on a nickname shows the real-time text being typed (every change is visible)
