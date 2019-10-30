const REFRESH_PAGE_FUNCTIONS = [refresh_save_page, refresh_restore_page, refresh_edit_page];
const MESSAGE_OPENED_POPUP = "tab_shelf-opened_popup"

var gConfig;
var gTabgroupList;

window.onload = function() {
    chrome.runtime.sendMessage( chrome.runtime.id, { message: MESSAGE_OPENED_POPUP } );
    
    set_popup_string();
    
    var pages = document.getElementsByName('tab_item');
    for( page_index = 0; page_index < pages.length; page_index++ ) {
        pages[page_index].addEventListener('change', refresh_page);
    }
    
    document.getElementById('sb_save_tab_list').addEventListener('change', select_save_tab);
    document.getElementById('sb_save_target_tabgroup_list').addEventListener('change', select_save_target_tabgroup);
    document.getElementById('it_save_new_tabgroup').addEventListener('input', input_new_tabgroup_name_to_save);
    document.getElementById('btn_save_tabs').addEventListener('click', save_tab);
    
    document.getElementById('sb_restore_tabgroup_list').addEventListener('change', select_restore_tabgroup);
    document.getElementById('cb_restore_is_delete_tabgroup').addEventListener('click', change_is_delete_on_restore);
    document.getElementById('cb_restore_is_empty_tabgroup').addEventListener('click', change_is_empty_on_restore);
    document.getElementById('cb_restore_is_open_new_window').addEventListener('click', change_is_open_new_window);
    document.getElementById('btn_restore_open_tabs').addEventListener('click', restore_tab_group);
    
    document.getElementById('sb_edit_tabgroup_list').addEventListener('change', select_edit_tabgroup);
    document.getElementById('it_edit_new_name').addEventListener('input', input_new_tabgroup_name_to_rename);
    document.getElementById('btn_edit_rename_tabgroup').addEventListener('click', rename_tabgroup);
    document.getElementById('btn_edit_delete_tabgroup').addEventListener('click', delete_tabgroup);
    document.getElementById('sb_edit_tab_list').addEventListener('change', select_edit_tab);
    document.getElementById('btn_edit_delete_tab').addEventListener('click', delet_tab);
    
    refresh_page();
    
    // 他のウィンドウでpopupが開かれたらウィンドウを閉じる
    chrome.runtime.onMessage.addListener( function( request, sender, callback ) {
        if( request.message === MESSAGE_OPENED_POPUP ) {
            window.close();
        }
        
        return true;
    });
};

function set_popup_string() {
    set_element_string('page_name_save', 'page_name_save');
    set_element_string('page_name_restore', 'page_name_restore');
    set_element_string('page_name_edit', 'page_name_edit');

    set_element_string('save_page_select_tab', 'save_page_select_tab');
    set_element_string('save_page_select_tabgroup', 'save_page_select_tabgroup');
    set_element_string('save_page_new_tabgroup', 'save_page_new_tabgroup');
    set_element_string('btn_save_tabs', 'save_page_save_button');

    set_element_string('restore_page_select_tabgroup', 'restore_page_select_tabgroup');
    set_element_string('restore_page_check_is_delete_tabgroup', 'restore_page_check_is_delete_tabgroup');
    set_element_string('restore_page_check_is_empty_tabgroup', 'restore_page_check_is_empty_tabgroup');
    set_element_string('restore_page_check_is_open_new_window', 'restore_page_check_is_open_new_window');
    set_element_string('btn_restore_open_tabs', 'restore_page_restore_button');

    set_element_string('edit_page_select_tabgroup', 'edit_page_select_tabgroup');
    set_element_string('btn_edit_delete_tabgroup', 'edit_page_delete_tabgroup_button');
    set_element_string('btn_edit_rename_tabgroup', 'edit_page_rename_tabgroup_button');
    set_element_string('edit_page_select_tab', 'edit_page_select_tab');
    set_element_string('btn_edit_delete_tab', 'edit_page_delete_tab_button');
}

function set_element_string( element_id, message_id ) {
    document.getElementById(element_id).innerHTML = chrome.i18n.getMessage(message_id);
}

/* ===== Page functions ===== */
function refresh_page() {
    event_start();
    
    var pages = document.getElementsByName('tab_item');
    for( page_index = 0; page_index < pages.length; page_index++ ) {
        if( pages[page_index].checked ) {
            REFRESH_PAGE_FUNCTIONS[page_index]();
            break;
        }
    }
    
    event_end();
}

function refresh_save_page() {
    refresh_save_tab_list();
    refresh_save_target_tabgroup_list();
    refresh_new_tabgroup_name_to_save();
    refresh_save_button_state();
}

function refresh_restore_page() {
    refresh_restore_tabgroup_list();
    refresh_is_delete_tabgroup_on_restore();
    refresh_is_empty_tabgroup_on_restore();
    refresh_is_open_new_window();
    refresh_restore_button_state();
}

function refresh_edit_page() {
    refresh_edit_tabgroup_list();
    refresh_edit_new_tabgroup_name();
    refresh_edit_tab_list();
    refresh_edit_buttons();
}

/* ===== Save functions ===== */
async function save_tab() {
    event_start();
    
    /* Get tab list to save */
    var elem_save_tab_list = document.getElementById('sb_save_tab_list');
    var options_tab_list = elem_save_tab_list.options;
    var save_tab_ids = [];
    for( var i = 0; i < options_tab_list.length; i++ ) {
        if( options_tab_list[i].selected ) {
            save_tab_ids.push( Number( options_tab_list[i].value ) );
        }
    }
    
    /* Save tabs */
    var save_target_id;
    var new_tabgroup;
    
    var tabs = await get_opening_tabs();
    
    new_tabgroup = document.getElementById('it_save_new_tabgroup').value;
    if( new_tabgroup == "" ) {
        /* 既存タブグループへの保存 */
        save_target_id = document.getElementById("sb_save_target_tabgroup_list").value;
    } else {
        /* 新規タブグループへの保存 */
        save_target_id = get_new_id();
        gTabgroupList[save_target_id] = { name: new_tabgroup, data: [] };
    }
    
    for( var index = 0; index < tabs.length; index++ ) {
        if( save_tab_ids.indexOf( tabs[index].id ) != -1 ) {
            gTabgroupList[save_target_id].data.push({ name: tabs[index].title, url: tabs[index].url });
        }
    }
    
    /* If selected all tabs, open new tab */
    if( tabs.length == save_tab_ids.length ) {
        await open_tab( "chrome://newtab/", chrome.windows.WINDOW_ID_CURRENT );
    }
    
    /* Close tabs */
    save_all_nvdata();      // タブを閉じたときにpopupが閉じる可能性があるので、事前にデータを保存しておく
    await close_tabs( save_tab_ids );
    
    // タブを閉じた直後に更新するとタブが残っているように見えるため、100msウェイトを入れる
    setTimeout( function() { refresh_save_page(); }, 100 );
    
    event_end();
}

function select_save_tab() {
    event_start();
    
    refresh_save_button_state();
    
    event_end();
}

function select_save_target_tabgroup() {
    event_start();
    
    refresh_new_tabgroup_name_to_save();
    refresh_save_button_state();
    
    event_end();
}

function input_new_tabgroup_name_to_save() {
    event_start();
    
    refresh_save_target_tabgroup_list();
    refresh_save_button_state();
    
    event_end();
}

async function refresh_save_tab_list() {
    var tabs = await get_opening_tabs();
    var elem_save_tab_list = document.getElementById("sb_save_tab_list");
    
    clear_select_box(elem_save_tab_list);
    for( var index = 0; index < tabs.length; index++ ) {
        var option = document.createElement("option");
        option.title = tabs[index].title;
        option.text = tabs[index].title;
        option.value = tabs[index].id;
        elem_save_tab_list.appendChild(option);
    }
}

function refresh_save_target_tabgroup_list() {
    set_tabgroup_list_for_select_box("sb_save_target_tabgroup_list");
}

function refresh_new_tabgroup_name_to_save() {
    document.getElementById('it_save_new_tabgroup').value = "";
}

function refresh_save_button_state() {
    document.getElementById('btn_save_tabs').disabled = !is_save_enable();
}

function is_save_enable() {
    var rtn = false;
    if( document.getElementById("sb_save_tab_list").selectedIndex != -1 ) {
        if( ( document.getElementById("sb_save_target_tabgroup_list").selectedIndex != -1 ) 
         || ( document.getElementById('it_save_new_tabgroup').value != "" ) ) {
            rtn = true;
        }
    }
    
    return rtn;
}

/* ===== Restore functions ===== */
function change_is_delete_on_restore() {
    event_start();
    
    gConfig["is_delete_on_restore"] = document.getElementById('cb_restore_is_delete_tabgroup').checked;
    
    refresh_is_empty_tabgroup_on_restore();
    
    event_end();
}

function change_is_empty_on_restore() {
    event_start();
    
    gConfig["is_empty_on_restore"] = document.getElementById('cb_restore_is_empty_tabgroup').checked;
    
    event_end();
}

function change_is_open_new_window() {
    event_start();
    
    gConfig["is_open_new_window"] = document.getElementById('cb_restore_is_open_new_window').checked;
    
    event_end();
}

function restore_tab_group() {
    event_start();
    
    var elem_restore_tabgroup_list = document.getElementById('sb_restore_tabgroup_list');
    var is_open_new_window = gConfig["is_open_new_window"];
    
    for( var i = 0; i < elem_restore_tabgroup_list.length; i++ ) {
        if( elem_restore_tabgroup_list[i].selected ) {
            var tabgroup_id = elem_restore_tabgroup_list[i].value;
            var tabgroup_data = gTabgroupList[tabgroup_id].data;
            
            open_tabs( tabgroup_data, is_open_new_window, true );
            
            if( gConfig["is_delete_on_restore"] ) {
                delete gTabgroupList[tabgroup_id];
            } else if( gConfig["is_empty_on_restore"] ) {
                gTabgroupList[tabgroup_id].data = [];
            }
        }
    }
    
    refresh_restore_page();
    
    event_end();
}

async function open_tabs( tabgroup_data, is_open_new_window, is_open_last_pos ) {
    var window_id;
    
    if( tabgroup_data.length > 0 ) {
        if( is_open_new_window ) {
            window_id = await open_window( tabgroup_data[0].url );
            tabgroup_data = tabgroup_data.slice( 1 );   // ウィンドウを開くときに1つ目のタブは開くため、削除する
        } else {
            window_id = chrome.windows.WINDOW_ID_CURRENT;
        }
        
        for( var data_index = 0; data_index < tabgroup_data.length; data_index++ ) {
            await open_tab( tabgroup_data[data_index].url, window_id );
        }
    }
}

function refresh_restore_tabgroup_list() {
    set_tabgroup_list_for_select_box("sb_restore_tabgroup_list");
}

function select_restore_tabgroup() {
    event_start();
    
    refresh_restore_button_state();
    
    event_end();
}

function refresh_is_delete_tabgroup_on_restore() {
    document.getElementById('cb_restore_is_delete_tabgroup').checked = gConfig["is_delete_on_restore"];
}

function refresh_is_empty_tabgroup_on_restore() {
    var is_disable = false;
    if( config_data["is_delete_on_restore"] == true ) {
        is_disable = true;
    }
    document.getElementById('cb_restore_is_empty_tabgroup').disabled = is_disable;
    document.getElementById('cb_restore_is_empty_tabgroup').checked = gConfig["is_empty_on_restore"];
}

function refresh_is_open_new_window() {
    document.getElementById('cb_restore_is_open_new_window').checked = gConfig["is_open_new_window"];
}

function refresh_restore_button_state() {
    document.getElementById('btn_restore_open_tabs').disabled = !is_restore_enable();
}

function is_restore_enable() {
    var rtn = false;
    
    if( document.getElementById("sb_restore_tabgroup_list").selectedIndex != -1 ) {
        rtn = true;
    }
    
    return rtn;
}

/* ===== Edit functions ===== */
function select_edit_tabgroup() {
    event_start();
    
    var tabgroup_list = document.getElementById("sb_edit_tabgroup_list");
    var select_tabgroup_name = tabgroup_list.options[tabgroup_list.selectedIndex].text;
    
    document.getElementById("it_edit_new_name").value = select_tabgroup_name;
    
    refresh_edit_tab_list();
    refresh_edit_buttons();
    
    event_end();
}

function select_edit_tab() {
    event_start();
    
    refresh_edit_buttons();
    
    event_end();
}

function input_new_tabgroup_name_to_rename() {
    event_start();
    
    refresh_edit_buttons();
    
    event_end();
}

function rename_tabgroup() {
    event_start();
    
    var new_name = document.getElementById("it_edit_new_name").value;
    var rename_tabgroup_id = document.getElementById("sb_edit_tabgroup_list").value;
    gTabgroupList[rename_tabgroup_id].name = new_name;
    refresh_edit_page();
    
    event_end();
}

function delete_tabgroup() {
    event_start();
    
    var delete_tabgroup_id = document.getElementById("sb_edit_tabgroup_list").value;
    delete gTabgroupList[delete_tabgroup_id];
    refresh_edit_page();
    
    event_end();
}

function delet_tab() {
    event_start();
    
    var delete_tabgroup_id = document.getElementById("sb_edit_tabgroup_list").value;
    var options_delete_tab_list = document.getElementById('sb_edit_tab_list').options;
    for( var i = options_delete_tab_list.length - 1; i >= 0; i-- ) {   // 配列要素を削除していくので、後ろからサーチする
        if( options_delete_tab_list[i].selected ) {
            delete gTabgroupList[delete_tabgroup_id].data.splice(i, 1);
        }
    }
    refresh_edit_tab_list();
    
    event_end();
}

function refresh_edit_tabgroup_list() {
    set_tabgroup_list_for_select_box("sb_edit_tabgroup_list");
}

function refresh_edit_new_tabgroup_name() {
    document.getElementById('it_edit_new_name').value = "";
}

function refresh_edit_tab_list() {
    var elem_edit_tab_list = document.getElementById("sb_edit_tab_list");
    
    clear_select_box( elem_edit_tab_list );
    
    var select_tabgroup_id = document.getElementById("sb_edit_tabgroup_list").value;
    if( select_tabgroup_id != "" ) {
        var tab_data = gTabgroupList[select_tabgroup_id].data;
        for( var tab_index = 0; tab_index < tab_data.length; tab_index++ ) {
            var option = document.createElement("option");
            option.title = tab_data[tab_index].name;
            option.text = tab_data[tab_index].name;
            option.value = tab_index;
            elem_edit_tab_list.appendChild(option);
        }
    }
}

function refresh_edit_buttons() {
    refresh_rename_button_state();
    refresh_delete_tabgroup_button_state();
    refresh_delete_tab_button_state();
}

function refresh_rename_button_state() {
    document.getElementById('btn_edit_rename_tabgroup').disabled = !is_rename_enable();
}

function is_rename_enable() {
    var rtn = false;
    
    if( ( document.getElementById("sb_edit_tabgroup_list").selectedIndex != -1 )
     && ( document.getElementById("it_edit_new_name").value != "" ) ) {
        rtn = true;
    }
    
    return rtn;
}

function refresh_delete_tabgroup_button_state() {
    document.getElementById('btn_edit_delete_tabgroup').disabled = !is_delete_tabgroup_enable();
}

function is_delete_tabgroup_enable() {
    var rtn = false;
    
    if( document.getElementById("sb_edit_tabgroup_list").selectedIndex != -1 ) {
        rtn = true;
    }
    
    return rtn;
}

function refresh_delete_tab_button_state() {
    document.getElementById('btn_edit_delete_tab').disabled = !is_delete_tab_enable();
}

function is_delete_tab_enable() {
    var rtn = false;
    
    if( ( document.getElementById("sb_edit_tabgroup_list").selectedIndex != -1 )
     && ( document.getElementById("sb_edit_tab_list").selectedIndex != -1 ) ) {
        rtn = true;
    }
    
    return rtn;
}

/* ===== Common functions ===== */
function set_tabgroup_list_for_select_box( select_box_id ) {
    var elem_select_box = document.getElementById(select_box_id);
    
    clear_select_box( elem_select_box );
    
    for( id in gTabgroupList ) {
        var option = document.createElement("option");
        option.title = gTabgroupList[id].name;
        option.text = gTabgroupList[id].name;
        option.value = id;
        elem_select_box.appendChild(option);
    }
}

async function get_opening_tabs() {
    return new Promise ( function( resolve, reject ) {
        chrome.tabs.query( { currentWindow: true }, function( tabs ) {
            resolve( tabs );
        });
    });
}

async function close_tabs( tab_ids ) {
    return new Promise ( function( resolve, reject ) {
        chrome.tabs.remove( tab_ids, function () {
            resolve();
        });
    });
}

async function open_window( new_url ) {
    return new Promise ( function( resolve, reject ) {
        chrome.windows.create( { url: new_url }, function ( window ) {
            resolve( window.id );
        });
    });
}

async function open_tab( new_url, target_window_id ) {
    return new Promise ( function( resolve, reject ) {
        chrome.tabs.create({
            windowId: target_window_id,
            url: new_url,
            active: false
        });
        
        resolve();
    });
}

function event_start() {
    load_all_nvdata();
}

function event_end() {
    save_all_nvdata();
}

function save_all_nvdata() {
    save_tabgroup_list();
    save_config_data();
}

function load_all_nvdata() {
    gTabgroupList = get_tabgroup_list();
    gConfig = get_config_data();
}

function get_config_data() {
    config_data = read_saved_data( "config" );
    
    if( !( "is_delete_on_restore" in config_data ) ) {
        config_data["is_delete_on_restore"] = false;
    }
    if( !( "is_empty_on_restore" in config_data ) ) {
        config_data["is_empty_on_restore"] = true;
    }
    if( !( "is_open_new_window" in config_data ) ) {
        config_data["is_open_new_window"] = false;
    }
    
    return config_data;
}

function save_config_data() {
    save_data( "config", gConfig );
}

function get_tabgroup_list() {
    return read_saved_data( "tabgroup" );
}

function save_tabgroup_list() {
    save_data( "tabgroup", gTabgroupList );
}

function read_saved_data( data_tag ) {
    try {
        return JSON.parse( localStorage[data_tag] );
    }
    catch(e) {
        return {};
    }
}

function save_data( data_tag, json_data ) {
    localStorage[data_tag] = JSON.stringify( json_data );
}

function clear_select_box( select_box_elem )
{
    if( select_box_elem.hasChildNodes() ) {
        while( select_box_elem.childNodes.length > 0 ) {
            select_box_elem.removeChild( select_box_elem.firstChild );
        }
    }
}

function get_new_id() {
    var now = new Date();
    
    var year = number_to_string_with_zero_pad(now.getFullYear(), 4);
    var month = number_to_string_with_zero_pad(now.getMonth() + 1, 2);
    var date = number_to_string_with_zero_pad(now.getDate(), 2);
    var hour = number_to_string_with_zero_pad(now.getHours(), 2);
    var min = number_to_string_with_zero_pad(now.getMinutes(), 2);
    var sec = number_to_string_with_zero_pad(now.getSeconds(), 2);
    var msec = number_to_string_with_zero_pad(now.getMilliseconds(), 3);
    
    return year + month + date + hour + min + sec + msec;
}

function number_to_string_with_zero_pad( num, len ){
    return ( Array(len).join('0') + num ).slice( -len );
}
