const REFRESH_PAGE_FUNCTIONS = [refresh_save_page, refresh_restore_page, refresh_edit_page];

var gConfig;
var gTabgroupList;

window.onload = function() {
    set_popup_string();
    
    var pages = document.getElementsByName('tab_item');
    for( page_index = 0; page_index < pages.length; page_index++ ) {
        pages[page_index].addEventListener('change', change_page);
    }
    
    document.getElementById('sb_save_tab_list').addEventListener('change', select_save_tab);
    document.getElementById('sb_save_target_tabgroup_list').addEventListener('change', select_save_target_tabgroup);
    document.getElementById('it_save_new_tabgroup').addEventListener('input', input_new_tabgroup_name_to_save);
    document.getElementById('btn_save_tabs').addEventListener('click', save_tab);
    
    document.getElementById('sb_restore_tabgroup_list').addEventListener('change', select_restore_tabgroup);
    document.getElementById('cb_restore_is_delete_tabgroup').addEventListener('click', change_is_delete_on_restore);
    document.getElementById('btn_restore_open_tabs').addEventListener('click', restore_tab_group);
    
    document.getElementById('sb_edit_tabgroup_list').addEventListener('change', select_edit_tabgroup);
    document.getElementById('it_edit_new_name').addEventListener('input', input_new_tabgroup_name_to_rename);
    document.getElementById('btn_edit_rename_tabgroup').addEventListener('click', rename_tabgroup);
    document.getElementById('btn_edit_delete_tabgroup').addEventListener('click', delete_tabgroup);
    document.getElementById('sb_edit_tab_list').addEventListener('change', select_edit_tab);
    document.getElementById('btn_edit_delete_tab').addEventListener('click', delet_tab);

    gTabgroupList = get_tabgroup_list();
    gConfig = get_config_data();
    refresh_save_page();  // Default page is save.
};

window.onunload = function () {
    save_tabgroup_list();
    save_config_data();
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
function change_page() {
    var pages = document.getElementsByName('tab_item');
    for( page_index = 0; page_index < pages.length; page_index++ ) {
        if( pages[page_index].checked ) {
            REFRESH_PAGE_FUNCTIONS[page_index]();
            break;
        }
    }
}

function refresh_save_page() {
    refresh_save_tab_list();
    refresh_save_target_tabgroup_list();
    refresh_new_tabgroup_name_to_save();
    refresh_save_button_state();
}

function refresh_restore_page() {
    refresh_is_delete_tabgroup_on_restore();
    refresh_restore_tabgroup_list();
    refresh_restore_button_state();
}

function refresh_edit_page() {
    refresh_edit_tabgroup_list();
    refresh_edit_new_tabgroup_name();
    refresh_edit_tab_list();
    refresh_edit_buttons();
}

/* ===== Save functions ===== */
function save_tab() {
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
    chrome.tabs.query({currentWindow: true}, function( tabs ) {
        var save_target_id;
        var new_tabgroup;
        
        new_tabgroup = document.getElementById('it_save_new_tabgroup').value;
        if( new_tabgroup == "" ) {
            /* 既存タブグループへの保存 */
            save_target_id = document.getElementById("sb_save_target_tabgroup_list").value;
        } else {
            /* 新規タブグループへの保存 */
            save_target_id = get_new_id();
            gTabgroupList[save_target_id] = {name: new_tabgroup, data: []};
        }
        
        for( var index = 0; index < tabs.length; index++ ) {
            if( save_tab_ids.indexOf( tabs[index].id ) != -1 ) {
                gTabgroupList[save_target_id].data.push({ name: tabs[index].title, url: tabs[index].url });
            }
        }
        store_all();
        
        /* If selected all tabs, open new tab */
        if( tabs.length == save_tab_ids.length ) {
            chrome.tabs.create({
                url: "chrome://newtab/",
                active: false
            });
        }
        
        /* Close tabs */
        chrome.tabs.remove(save_tab_ids, function () {
            setTimeout( function() {    // タブを閉じた直後だとタブが存在するように見えるため、100msウェイトを入れる
                refresh_save_page();
            }, 100 );
        });
    });
}

function select_save_tab() {
    refresh_save_button_state();
}

function select_save_target_tabgroup() {
    refresh_new_tabgroup_name_to_save();
    refresh_save_button_state();
}

function input_new_tabgroup_name_to_save() {
    refresh_save_target_tabgroup_list();
    refresh_save_button_state();
}

function refresh_save_tab_list() {
    chrome.tabs.query({currentWindow: true}, function( tabs ) {
        var elem_save_tab_list = document.getElementById("sb_save_tab_list");
        
        clear_select_box(elem_save_tab_list);
        for( var index = 0; index < tabs.length; index++ ) {
            var option = document.createElement("option");
            option.title = tabs[index].title;
            option.text = tabs[index].title;
            option.value = tabs[index].id;
            elem_save_tab_list.appendChild(option);
        }
    });
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
    gConfig["is_delete_on_restore"] = document.getElementById('cb_restore_is_delete_tabgroup').checked;

    store_all();
}

function restore_tab_group() {
    var elem_restore_tabgroup_list = document.getElementById('sb_restore_tabgroup_list');
    
    for( var i = 0; i < elem_restore_tabgroup_list.length; i++ ) {
        if( elem_restore_tabgroup_list[i].selected ) {
            var tabgroup_id = elem_restore_tabgroup_list[i].value;
            var tab_list_data = gTabgroupList[tabgroup_id].data;
            for( var data_index = 0; data_index < tab_list_data.length; data_index++ ) {
                chrome.tabs.create({
                    url: tab_list_data[data_index].url,
                    active: false
                });
            }
            if( gConfig["is_delete_on_restore"] ) {
                delete gTabgroupList[tabgroup_id];
            }
        }
    }
    
    refresh_restore_page();
    
    store_all();
}

function refresh_restore_tabgroup_list() {
    set_tabgroup_list_for_select_box("sb_restore_tabgroup_list");
}

function select_restore_tabgroup() {
    refresh_restore_button_state();
}

function refresh_is_delete_tabgroup_on_restore() {
    if( !( "is_delete_on_restore" in gConfig ) ) {
        gConfig["is_delete_on_restore"] = true;
        store_all();
    }
    document.getElementById('cb_restore_is_delete_tabgroup').checked = gConfig["is_delete_on_restore"];
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
    var tabgroup_list = document.getElementById("sb_edit_tabgroup_list");
    var select_tabgroup_name = tabgroup_list.options[tabgroup_list.selectedIndex].text;
    
    document.getElementById("it_edit_new_name").value = select_tabgroup_name;
    
    refresh_edit_tab_list();
    refresh_edit_buttons();
}

function select_edit_tab() {
    refresh_edit_buttons();
}

function input_new_tabgroup_name_to_rename() {
    refresh_edit_buttons();
}

function rename_tabgroup() {
    var new_name = document.getElementById("it_edit_new_name").value;
    var rename_tabgroup_id = document.getElementById("sb_edit_tabgroup_list").value;
    gTabgroupList[rename_tabgroup_id].name = new_name;
    refresh_edit_page();
    
    store_all();
}

function delete_tabgroup() {
    var delete_tabgroup_id = document.getElementById("sb_edit_tabgroup_list").value;
    delete gTabgroupList[delete_tabgroup_id];
    refresh_edit_page();
    
    store_all();
}

function delet_tab() {
    var delete_tabgroup_id = document.getElementById("sb_edit_tabgroup_list").value;
    var options_delete_tab_list = document.getElementById('sb_edit_tab_list').options;
    for( var i = options_delete_tab_list.length - 1; i >= 0; i-- ) {   // 配列要素を削除していくので、後ろからサーチする
        if( options_delete_tab_list[i].selected ) {
            delete gTabgroupList[delete_tabgroup_id].data.splice(i, 1);
        }
    }
    refresh_edit_tab_list();
    
    store_all();
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

function store_all() {
    save_tabgroup_list();
    save_config_data();
}

function get_config_data() {
    return read_saved_data( "config" );
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
