defmodule UccChatWeb.RoomChannel.MessageInput.SpecialKeys do

  alias UccChatWeb.RoomChannel.MessageInput
  alias UccChatWeb.RoomChannel.Message
  alias UccChatWeb.RoomChannel.MessageInput.Buffer

  use UccChatWeb.RoomChannel.Constants
  require Logger

  def handle_in(%{open?: true, state: %{buffer: ""}} = context, @bs) do
    MessageInput.close_popup(context)
  end

  def handle_in(context,  key) when key in [@bs, @left_arrow, @right_arrow] do
    Logger.info "state: #{inspect context.state}"
    case Buffer.match_all_patterns context.state.head do
      nil ->
        Logger.info "got nil"
        MessageInput.close_popup(context)
      {pattern, key} ->
        Logger.info "pattern: #{inspect {pattern, key}}"
        MessageInput.dispatch_handle_in(key, pattern, context)
    end
  end

  def handle_in(%{app: app, open?: true, state: state} = context, key) when key in [@tab, @cr] do
    selected = MessageInput.get_selected_item(context)

    # app_key = @app_key_lookup[app]
    # updated_buffer = Regex.replace ~r/(#{app_key})[^\s]*$/, state.head, "\\1#{selected}"
    # Logger.info "updated_buffer: #{inspect updated_buffer}"
    # Logger.info "state: #{inspect state}"
    buffer = Buffer.replace_word(state.buffer, selected, state.start)
    app
    |> Buffer.app_module
    |> apply(:handle_select, [buffer, selected, context])
    MessageInput.close_popup(context)
  end

  def handle_in(context, @tab) do
    context
  end

  def handle_in(context, @cr) do
    Logger.info "cr event: #{inspect context.sender["event"]}"
    unless context.sender["event"]["shiftKey"] do
      if editing?(context.sender) do
        Message.edit_message(context.socket, context.sender, context.client)
      else
        Message.new_message(context.socket, context.sender, context.client)
      end
    end
  end


  def handle_in(%{app: _, open?: true} = context, @esc) do
    MessageInput.close_popup context
  end

  def handle_in(context, @esc) do
    Message.cancel_edit context.socket, context.sender, context.client
  end

  def handle_in(%{app: _, client: client} = context, @dn_arrow) do
    Logger.info "down arrow"
    MessageInput.send_js context, "UccUtils.downArrow()"
  end

  def handle_in(%{app: _, open?: true} = context, @up_arrow) do
    Logger.info "up arrow"
    MessageInput.send_js context, "UccUtils.upArrow()"
  end

  def handle_in(context, @up_arrow) do
    Message.open_edit context.socket
  end

  def handle_in(context, _key), do: context

  defp update_state_backspace(context) do
    update_in(context, [:state, :head], &String.replace(&1, ~r/.$/, ""))
    context
  end

  defp editing?(%{"classes" => classes}) do
    Enum.any? classes, fn {_, class} -> class == "editing" end
  end

end
