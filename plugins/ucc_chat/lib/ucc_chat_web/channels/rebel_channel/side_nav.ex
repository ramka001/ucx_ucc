defmodule UccChatWeb.RebelChannel.SideNav do
  use UccChatWeb.RebelChannel.Macros

  defjs :open do
    alias UccChatWeb.RebelChannel.{RoomHistoryManager, NavMenu}, warn: false
    """
    #{RoomHistoryManager.cache_room_content_js()};
    #{NavMenu.open_js()};
    $('div.flex-nav').removeClass('animated-hidden');
    UccChat.sideNav.set_nav_top_icon('close');
    """
  end

  # defjs :set_nav_top_icon, [:icon] do

  # end

  def this do
    "UccChat.sideName"
  end
end
