import * as cc from "./chat_channel"
import * as main from "./main"

const start_conversation = `<li class="start color-info-font-color">${gettext.start_of_conversation}</li>`
const container = '.messages-box .wrapper ul'
const wrapper = '.messages-box .wrapper'
const debug = true
console.log('loading room_history_manager');

UccChat.on_load(function(ucc_chat) {
  ucc_chat.roomHistoryManager = new RoomHistoryManager(ucc_chat)
})

class RoomHistoryManager {
  constructor(ucc_chat) {
    this.ucc_chat = ucc_chat
    this.is_loading = true
    this.has_more = false
    this.has_more_next = false
    this.scroll_pos = {}
    this.current_room = undefined
    this.scroll_window = undefined
    this.scroll_to = ucc_chat.scroll_to

    setInterval(e => {
      this.update_scroll_pos()
    }, 1000)

    // console.log('roomHistoryManager.constructor', $(container).has('li.load-more'))
    if ($(container).has('li.load-more').length > 0) {
      console.log('length > 0')
      this.has_more = true
    }
  }

  get isLoading()   { return this.is_loading }
  get hasMore()     { return this.has_more }
  get hasMoreNext() { return this.has_more_next }
  set setHasMoreNext(on) {
    if (on) {
      $(wrapper).addClass('has-more-next')
      $('.jump-recent').removeClass('not')
    } else {
      $(wrapper).removeClass('has-more-next')
      $('.jump-recent').addClass('not')
    }
  }

  get_bottom_message() {
    let list = $(container + ' li[id]')
    let box = $(wrapper)[0].getBoundingClientRect()
    let found = list[list.length - 1]
    list.each((i, item) => {
      let msg_box = item.getBoundingClientRect()
      if (msg_box.bottom == box.bottom || msg_box.top < box.bottom && msg_box.bottom > box.bottom) {
        found = item
      }
    })
    return found
  }

  scroll_to_message(ts) {
    console.log('scroll_to_message', ts)
    // console.log('ts', ts)
    let target = $('.messages-box li[data-timestamp="' + ts + '"]')
    // console.log('target', target)

    if (target.offset()) {
      this.scroll_to(target)
    } else {
      // this.getSurroundingMessages(ts)
    }
  }

  fix_new_days() {
    if (debug) { console.log('fix_new_days'); }
    let list = $(container + ' li[id]')
    let last = list.length - 1
    for (let i = 0; i < last - 1; i++) {
      let item = list[i]
      if ($(item).hasClass('new-day') && i > 0) {
        if ($(item).data('date') == $(list[i - 1]).data('date'))
          $('#' + $(item).attr('id')).removeClass('new-day')
      }
    }
  }

  cache_room() {
    if (ucxchat.channel_id)
      this.cached_scrollTop = $(wrapper)[0].scrollTop
  }
  restore_cached_room() {
    if (ucxchat.channel_id) {
      $(wrapper)[0].scrollTop = this.cached_scrollTop
      UccChat.roomManager.bind_history_manager_scroll_event()
    }
  }

  get getMore() {
    if (debug) { console.log('roomHistoryManager.getMore()')}


    this.is_loading = true
    UccUtils.add_page_animation_styles()
    this.startGetMoreAnimation()

    let html = $('.messages-box .wrapper ul').html()
    let first_id = $('.messages-box .wrapper ul li[id]').first().attr('id')

    cc.get('/messages', {timestamp: $('li.message').first().attr('data-timestamp')})
      .receive("ok", resp => {
        if (debug) { console.log('++++++++++! got response back from loading', resp) }
        let has_more = `<li class="load-more">${UccUtils.loading_animation()}</li>`

        $(container)[0].innerHTML = has_more + resp.html + html

        if (debug) { console.log('finished loading', first_id) }

        this.scroll_to($('#' + first_id), -80)

        this.fix_new_days()

        $('li.load-more').remove()

        if (!resp.has_more) {
          $(container).children().first().addClass('new-day')
          $(container).prepend(start_conversation)
        } else {
          $(container).prepend(UccUtils.loadmore())
        }

        UccUtils.remove_page_loading()
        this.removeGetMoreAnimation()
        this.is_loading = false
        this.has_more = resp.has_more
        this.has_more_next = resp.has_more_next
        this.ucc_chat.main.run(this.ucc_chat)
        Rebel.set_event_handlers(container);
      })
  }
  get getMoreNext() {

    UccUtils.add_page_animation_styles()
    this.startGetMoreNextAnimation()
    this.is_loading = true

    let html = $(container).html()
    let ts = $('.messages-box li[data-timestamp]').last().data('timestamp')
    let last_id = $('.messages-box li[data-timestamp]').last().attr('id')

    cc.get('/messages/previous', {timestamp: ts})
      .receive("ok", resp => {
        if (debug) { console.log('getMoreNext resp', resp)}
        $('.messages-box .wrapper ul li:last.load-more').addClass('load-more-next')

        $('.messages-box .wrapper ul')[0].innerHTML = html + resp.html

        this.scroll_to($('#' + last_id), 0)
        if (resp.has_more_next) {
          this.setHasMoreNext = true
          $('.messages-box .wrapper ul').append(UccUtils.loadmore())
        } else {
          this.setHasMoreNext = false
        }

        // $('.load-more-next').remove()
        UccUtils.remove_page_loading()
        this.removeGetMoreNextAnimation()
        this.is_loading = false
        this.has_more_next = resp.has_more_next
        this.ucc_chat.main.run(this.ucc_chat)
        Rebel.set_event_handlers(container);
      })
  }

  new_room(room) {
    console.log('new_room', room)
    this.current_room = room
    this.is_loading = false
    this.has_more_next = $('.messages-box .wrapper.has-more-next')[0]
    console.log('has_more_next', this.has_more_next);
    // this.has_more = false
    // this.has_more_next = false
  }

  scroll_new_window() {
    this.is_loading = true
    this.scroll_window = $(wrapper)[0]
    if (!this.scroll_pos[this.current_room]) {
      // console.log('scroll_new_window this.current_room', this.current_room)
      this.ucc_chat.userchan.push("get:currentMessage", {room: this.current_room})
        .receive("ok", resp => {
          // console.warn('scroll_new_window ok resp', resp)
          this.set_scroll_top("ok", resp)
          // UccUtils.remove_page_loading()
          console.log('scroll new window after get:currentMessage response')
        })
        .receive("error", resp => {
          // console.warn('scroll_new_window err resp', resp)
          //UccUtils.remove_page_loading()
          this.set_scroll_top("error", resp)
        })
    } else {
      // console.warn('scroll_new_window else this', this)
      // UccUtils.remove_page_loading()
      this.set_scroll_top("ok", {value: this.scroll_pos[this.current_room]})
    }

    setTimeout(function() {
      UccChat.roomHistoryManager.is_loading = false;
      console.log('scroll new window timeout')
    }, 1800);
  }

  set_scroll_top(code, resp) {
    if (resp.value == "") {
      let elem = $(container)
      // console.log('set_scroll_top 1 value', resp, elem, elem.parent().scrollTop())
      UccUtils.scroll_bottom()
    } else {
      console.log('set_scroll_top 2 value', resp)
      if (code == "ok") {
        this.scroll_to_message(resp.value)
      } else {
        UccUtils.scroll_bottom()
      }
    }
  }

  update_scroll_pos() {
    if (!this.is_loading && this.scroll_window && $(wrapper).length > 0) {
      let current_message = this.bottom_message_ts()
      if ((current_message != this.scroll_pos[this.current_room])) {
        this.scroll_pos[this.current_room] = current_message
        if (current_message && current_message != "")
          this.ucc_chat.userchan.push("update:currentMessage", {value: current_message})
      }
    }
  }

  getSurroundingMessages(timestamp) {
    if (debug) { console.log("jump-to need to load some messages", timestamp) }
    this.is_loading = true
    UccUtils.page_loading()
    $('.messages-box .wrapper ul li.load-more').html(UccUtils.loading_animation())
    cc.get('/messages/surrounding', {timestamp: timestamp})
      .receive("ok", resp => {
        $(container)[0].innerHTML = resp.html
        let message_id = $(`.messages-box li[data-timestamp="${timestamp}"]`).attr('id')
        console.log('message_id', message_id)
        if (message_id) {
          this.scroll_to($('#' + message_id), -200)
        } else {
          console.warn('invalid timestamp', timestamp)
        }
        if (resp.has_more_next) {
          this.setHasMoreNext = true
          $('.messages-box .wrapper ul:last').append(UccUtils.loadmore())
        } else {
          this.setHasMoreNext = false
        }
        if (resp.has_more) {
          $('.messages-box .wrapper ul').prepend(UccUtils.loadmore())
        }
        UccUtils.remove_page_loading()
        this.has_more_next = resp.has_more_next
        this.has_more = resp.has_more
        this.is_loading = false
        this.ucc_chat.main.run(this.ucc_chat)
        Rebel.set_event_handlers(container);
      })
  }

  getRecent() {
    UccUtils.page_loading()
    $(container).prepend(UccUtils.loadmore_with_animation())
    UccUtils.page_loading()
    this.is_loading = true

    cc.get('/messages/last')
      .receive("ok", resp => {
        $('.messages-box .wrapper ul')[0].innerHTML = resp.html
        $(container + ' li:first.load-more').remove()
        $('.messages-box .wrapper').animate({
          scrollTop: UccUtils.getScrollBottom()
        }, 1000);
        this.setHasMoreNext = false
        this.has_more_next = false
        this.has_more = true
        this.is_loading = false
        this.ucc_chat.main.run(this.ucc_chat)
      })
  }
  bottom_message_ts() {
    let cm = this.get_bottom_message()
    if (cm)
      return cm.getAttribute('data-timestamp')
  }

  startGetMoreAnimation() {
    if (debug) { console.log('startGetMoreAnimation') }
    $('.messages-box .wrapper ul li:first.load-more').html(UccUtils.loading_animation())
  }
  startGetMoreNextAnimation() {
    if (debug) { console.log('startGetMoreNextAnimation') }
    this.removeGetMoreNextAnimation()
    $(container).append(UccUtils.loadmore_with_animation())
  }
  removeGetMoreAnimation() {
    if (debug) { console.log('removeGetMoreAnimation') }
    $('.messages-box .wrapper ul > li.load-more').remove()
  }
  removeGetMoreNextAnimation() {
    if (debug) { console.log('removeGetMoreNextAnimation') }
    $('.messages-box .wrapper ul > li)').not(':eq(0)').find('.load-more').remove()
  }
}

export default RoomHistoryManager

