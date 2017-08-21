defmodule UccChat.ChatDat do
  alias UccChat.{Channel, MessageService}
  alias UcxUcc.Repo
  alias UcxUcc.Accounts.User
  alias UccChat.Schema.Channel, as: ChannelSchema

  require Logger

  defstruct user: nil, room_types: [], settings: %{}, rooms: [],
            channel: nil, messages: nil, room_map: %{}, active_room: %{},
            status: "offline", room_route: "channels", messages_info: %{},
            previews: []

  def new(user, channel, messages \\ [])
  def new(%User{roles: %Ecto.Association.NotLoaded{}} = user,
    %ChannelSchema{} = channel, messages) do
    user
    |> Repo.preload([:roles])
    |> new(channel, messages)
  end
  def new(%User{} = user, %ChannelSchema{} = channel, messages) do
    user = preload_phone_status user
    %{room_types: room_types, rooms: rooms, room_map: room_map,
      active_room: ar} =
        UccChat.ChannelService.get_side_nav(user, channel.id)

    previews = MessageService.message_previews(user.id, messages)
    # Logger.warn "message previews: #{inspect previews}"

    status = UccChat.PresenceAgent.get user.id

    %__MODULE__{
      status: status,
      user: user,
      room_types: room_types,
      rooms: rooms,
      room_map: room_map,
      channel: channel,
      messages: messages,
      active_room: ar,
      room_route: Channel.room_route(channel),
      previews: previews
    }
  end

  def new(%User{} = user, channel_id, messages) do
    channel = Channel.get(channel_id)
    new(user, channel, messages)
  end

  def new(user) do
    user = preload_phone_status user
    %{room_types: room_types, rooms: rooms, room_map: room_map,
      active_room: _ar} =
        UccChat.ChannelService.get_side_nav(user, nil)

    status = UccChat.PresenceAgent.get user.id
    %__MODULE__{
      status: status,
      user: user,
      room_types: room_types,
      rooms: rooms,
      room_map: room_map,
      channel: nil,
      messages: [],
      active_room: 0,
      room_route: "home"
    }
  end

  defp preload_phone_status(user) do
    if UccChat.phone_status? do
      user
      |> Repo.preload([:extension])
      |> load_phone_status
    else
      user
    end
  end

  defp load_phone_status(user) do
    apply UcxPresence, :set_status, [user]
  end

  def get_messages_info(chatd) do
    get_messages_info(chatd, chatd.user)
  end
  def get_messages_info(chatd, user) do
    case chatd.channel do
      %ChannelSchema{id: id} ->
        value = MessageService.get_messages_info(chatd.messages, id, user)
        # Logger.warn "chatd value: value: #{inspect value}"
        set(chatd, :messages_info, value)
      _ ->
        chatd
    end
  end

  def set(chatd, field, value) do
    struct chatd, [{field, value}]
  end

  def favorite_room?(%__MODULE__{} = chatd, channel_id) do
    with room_types <- chatd.rooms,
         stared when not is_nil(stared) <-
            Enum.find(room_types, &(&1[:type] == :stared)),
         room when not is_nil(room) <-
            Enum.find(stared, &(&1[:channel_id] == channel_id)) do
      true
    else
      _ -> false
    end
  end

  def get_channel_data(%__MODULE__{channel: %ChannelSchema{id: id},
    room_map: map}), do: map[id]

end
