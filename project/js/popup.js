var config;
var tabgroup_list;
var page_activate_event;

window.onload = function() {
    addEventListener("unload", function (event) {
        save_tabgroup_list(tabgroup_list);
        save_config_data(config);
    }, true);
    
    var pages = document.getElementsByName('tab_item');
    for( page_index = 0; page_index < pages.length; page_index++ ) {
        pages[page_index].addEventListener('change', change_page);
    }
    page_activate_event = [event_activate_save, event_activate_restore, event_activate_edit];
    
    document.getElementById('sb_save_tab_list').addEventListener('change', select_save_tab);
    document.getElementById('sb_save_target_tabgroup_list').addEventListener('change', select_save_tabgroup);
    document.getElementById('it_save_new_tabgroup').addEventListener('input', input_new_tabgroup);
    document.getElementById('btn_save_tabs').addEventListener('click', save_tab_list);
    document.getElementById('cb_restore_is_delete_tabgroup').addEventListener('click', change_is_delete_at_restore);
    document.getElementById('btn_restore_open_tabs').addEventListener('click', open_tab_list);
    document.getElementById('sb_edit_tabgroup_list').addEventListener('change', select_edit_tabgroup);
    document.getElementById('btn_edit_rename_tabgroup').addEventListener('click', rename_tabgroup);
    document.getElementById('btn_edit_delete_tabgroup').addEventListener('click', delete_tabgroup);
    document.getElementById('btn_edit_delete_tab').addEventListener('click', delet_tab);

    tabgroup_list = get_tabgroup_list();
    config = get_config_data();
    event_activate_save();  // Default page is save.
};

/* ===== Page functions ===== */
function change_page() {
    var pages = document.getElementsByName('tab_item');
    for( page_index = 0; page_index < pages.length; page_index++ ) {
        if( pages[page_index].checked ) {
            page_activate_event[page_index]();
        }
    }
}

function event_activate_save() {
    update_save_tab_list();
    update_save_target_tabgroup_list();
    document.getElementById('it_save_new_tabgroup').value = "";
    update_save_button_state();
}

function event_activate_restore() {
    set_restore_is_delete_tabgroup();
    update_restore_tabgroup_list();
}

function event_activate_edit() {
    update_edit_tabgroup_list();
    document.getElementById('it_edit_new_name').value = "";
    clear_select_box(document.getElementById('sb_edit_tab_list'));
}

/* ===== Save functions ===== */
function save_tab_list() {
    /* Get save tab list */
    var options_tab_list = document.getElementById('sb_save_tab_list').options;
    var save_tab_ids = [];
    for( var i = options_tab_list.length - 1; i >= 0; i-- ) {   // リストボックスを削除していくので、後ろからサーチする
        if( options_tab_list[i].selected ) {
            save_tab_ids.push( options_tab_list[i].value );
            document.getElementById('sb_save_tab_list').remove(i);
        }
    }
    
    chrome.tabs.query({currentWindow: true}, function( tabs ) {
        var new_tabgroup = document.getElementById('it_save_new_tabgroup').value;
        var save_target_id;
        if( new_tabgroup == "" ) {
            save_target_id = document.getElementById("sb_save_target_tabgroup_list").value;
        } else {
            save_target_id = get_new_id();
            tabgroup_list[save_target_id] = {name: new_tabgroup, data: []};
        }
        
        for( var index = 0; index < tabs.length; index++ ) {
            for( var save_tab_index = 0; save_tab_index < save_tab_ids.length; save_tab_index++ ) {
                if( tabs[index].id == save_tab_ids[save_tab_index] ) {
                    tabgroup_list[save_target_id].data.push({ name: tabs[index].title, url: tabs[index].url });
                    chrome.tabs.remove(tabs[index].id);
                    break;
                }
            }
        }
        update_save_target_tabgroup_list();
        document.getElementById('it_save_new_tabgroup').value = "";
    });
}

function select_save_tab() {
    update_save_button_state();
}

function select_save_tabgroup() {
    document.getElementById('it_save_new_tabgroup').value = "";
    update_save_button_state();
}

function input_new_tabgroup() {
    document.getElementById("sb_save_target_tabgroup_list").selectedIndex = -1;
    update_save_button_state();
}

function update_save_tab_list() {
    chrome.tabs.query({currentWindow: true}, function( tabs ) {
        var select = document.getElementById("sb_save_tab_list");
        
        clear_select_box(select);
        for( var index = 0; index < tabs.length; index++ ) {
            var option = document.createElement("option");
            option.text = tabs[index].title;
            option.value = tabs[index].id;
            select.appendChild(option);
        }
    });
}

function update_save_target_tabgroup_list() {
    set_tabgroup_list_for_select_box("sb_save_target_tabgroup_list");
}

function update_save_button_state() {
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
function change_is_delete_at_restore() {
    config["is_delete_at_restore"] = document.getElementById('cb_restore_is_delete_tabgroup').checked;
}

function open_tab_list() {
    var options = document.getElementById('sb_restore_tabgroup_list').options;
    
    for( var i = 0; i < options.length; i++ ) {
        if( options[i].selected ) {
            var tabgroup_id = options[i].value;
            var tab_list_data = tabgroup_list[tabgroup_id].data;
            for( var data_index = 0; data_index < tab_list_data.length; data_index++ ) {
                chrome.tabs.create({
                    url: tab_list_data[data_index].url,
                    active: false
                });
            }
            if( config["is_delete_at_restore"] ) {
                delete tabgroup_list[tabgroup_id];
            }
        }
    }
    
    window.close();
}

function update_restore_tabgroup_list() {
    set_tabgroup_list_for_select_box("sb_restore_tabgroup_list");
}

function set_restore_is_delete_tabgroup() {
    document.getElementById('cb_restore_is_delete_tabgroup').checked = config["is_delete_at_restore"];
}

/* ===== Edit functions ===== */
function select_edit_tabgroup() {
    var tabgroup_list = document.getElementById("sb_edit_tabgroup_list");
    var select_tabgroup_name = tabgroup_list.options[tabgroup_list.selectedIndex].text;
    var select_tabgroup_id = tabgroup_list.options[tabgroup_list.selectedIndex].value;
    
    document.getElementById("it_edit_new_name").value = select_tabgroup_name;
    
    update_edit_tablist();
}

function rename_tabgroup() {
    var new_name = document.getElementById("it_edit_new_name").value;
    var rename_tabgroup_id = document.getElementById("sb_edit_tabgroup_list").value;
    tabgroup_list[rename_tabgroup_id].name = new_name;
    event_activate_edit();
}

function delete_tabgroup() {
    var delete_tabgroup_id = document.getElementById("sb_edit_tabgroup_list").value;
    delete tabgroup_list[delete_tabgroup_id];
    update_edit_tabgroup_list();
    event_activate_edit();
}

function delet_tab() {
    var delete_tabgroup_id = document.getElementById("sb_edit_tabgroup_list").value;
    var options_delete_tab_list = document.getElementById('sb_edit_tab_list').options;
    for( var i = options_delete_tab_list.length - 1; i >= 0; i-- ) {   // リストボックスを削除していくので、後ろからサーチする
        if( options_delete_tab_list[i].selected ) {
            delete tabgroup_list[delete_tabgroup_id].data.splice(i, 1);
        }
    }
    update_edit_tablist();
}

function update_edit_tabgroup_list() {
    set_tabgroup_list_for_select_box("sb_edit_tabgroup_list");
}

function update_edit_tablist() {
    var select_tabgroup_id = document.getElementById("sb_edit_tabgroup_list").value;
    var select = document.getElementById("sb_edit_tab_list");
    
    clear_select_box( select );
    
    var tab_data = tabgroup_list[select_tabgroup_id].data;
    for( var tab_index = 0; tab_index < tab_data.length; tab_index++ ) {
        var option = document.createElement("option");
        option.text = tab_data[tab_index].name;
        option.value = tab_index;
        select.appendChild(option);
    }
}

/* ===== Common functions ===== */
function set_tabgroup_list_for_select_box( select_box_id ) {
    var select = document.getElementById(select_box_id);
    
    clear_select_box( select );
    
    for( id in tabgroup_list ) {
        var option = document.createElement("option");
        option.text = tabgroup_list[id].name;
        option.value = id;
        select.appendChild(option);
    }
}

function get_config_data() {
    return read_saved_data( "config" );
}

function save_config_data( json_data ) {
    save_data( "config", json_data );
}

function get_tabgroup_list() {
    return read_saved_data( "tabgroup" );
}

function save_tabgroup_list( json_data ) {
    save_data( "tabgroup", json_data );
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
    var msec = number_to_string_with_zero_pad(now.getMilliseconds(), 2);
    
    return year + month + date + hour + sec + msec;
}

function number_to_string_with_zero_pad( num, len ){
	return ( Array(len).join('0') + num ).slice( -len );
}
