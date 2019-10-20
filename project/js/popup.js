var tabmark_list;

window.onload = function() {
    addEventListener("unload", function (event) {
        save_tabmark_list(tabmark_list);
    }, true);
    
    document.getElementById('btn_restore_open_tabs').addEventListener('click', open_tab_list);
    document.getElementById('btn_save_tabs').addEventListener('click', add_tab_list);
    document.getElementById('sb_edit_tabmark_list').addEventListener('change', select_edit_tabmark);
    document.getElementById('btn_edit_rename_tabmark').addEventListener('click', rename_tabmark);
    document.getElementById('btn_edit_delete_tabmark').addEventListener('click', delete_tabmark);
    document.getElementById('btn_edit_delete_tab').addEventListener('click', delet_tab);

    tabmark_list = get_tabmark_list();

    update_save_tab_list();
    update_save_target_tabmark_list();
    update_restore_tabmark_list();
    update_edit_tabmark_list();
};

/* ===== Save functions ===== */
function add_tab_list() {
    /* Get save tab list */
    var options_tab_list = document.getElementById('sb_save_tab_list').options;
    var save_tab_ids = [];
    for( var i = 0; i < options_tab_list.length; i++ ) {
        if( options_tab_list[i].selected ) {
            save_tab_ids.push( options_tab_list[i].value );
        }
    }
    
    chrome.tabs.query({currentWindow: true}, function( tabs ) {
        var new_tabmark = document.getElementById('it_save_new_tabmark').value;
        var save_target_id;
        if( new_tabmark == "" ) {
            save_target_id = document.getElementById("sb_save_target_tabmark_list").value;
        } else {
            save_target_id = get_new_id();
            tabmark_list[save_target_id] = {name: new_tabmark, data: []};
        }
        
        for( var index = 0; index < tabs.length; index++ ) {
            for( var save_tab_index = 0; save_tab_index < save_tab_ids.length; save_tab_index++ ) {
                if( tabs[index].id == save_tab_ids[save_tab_index] ) {
                    tabmark_list[save_target_id].data.push({ name: tabs[index].title, url: tabs[index].url });
                    chrome.tabs.remove(tabs[index].id);
                    break;
                }
            }
        }
    });
}

function update_save_tab_list() {
    chrome.tabs.query({currentWindow: true}, function( tabs ) {
        var select = document.getElementById("sb_save_tab_list");
        
        for( var index = 0; index < tabs.length; index++ ) {
            var option = document.createElement("option");
            option.text = tabs[index].title;
            option.value = tabs[index].id;
            select.appendChild(option);
        }
    });
}

function update_save_target_tabmark_list() {
    set_tabmark_list_for_select_box("sb_save_target_tabmark_list");
}

/* ===== Restore functions ===== */
function open_tab_list() {
    var options = document.getElementById('sb_restore_tabmark_list').options;
    
    for( var i = 0; i < options.length; i++ ) {
        if( options[i].selected ) {
            var tab_list_data = tabmark_list[options[i].value].data;
            for( var data_index = 0; data_index < tab_list_data.length; data_index++ ) {
                chrome.tabs.create({
                    url: tab_list_data[data_index].url,
                    active: false
                });
            }
        }
    }
    
    window.close();
}

function update_restore_tabmark_list() {
    set_tabmark_list_for_select_box("sb_restore_tabmark_list");
}

/* ===== Edit functions ===== */
function select_edit_tabmark() {
    var tabmark_list = document.getElementById("sb_edit_tabmark_list");
    var select_tabmark_name = tabmark_list.options[tabmark_list.selectedIndex].text;
    var select_tabmark_id = tabmark_list.options[tabmark_list.selectedIndex].value;
    
    document.getElementById("it_edit_new_name").value = select_tabmark_name;
    
    update_edit_tablist();
}

function rename_tabmark() {
    var new_name = document.getElementById("it_edit_new_name").value;
    var rename_tabmark_id = document.getElementById("sb_edit_tabmark_list").value;
    tabmark_list[rename_tabmark_id][name] = new_name;
    update_edit_tabmark_list();
    document.getElementById("it_edit_new_name").value = "";
}

function delete_tabmark() {
    var delete_tabmark_id = document.getElementById("sb_edit_tabmark_list").value;
    delete tabmark_list[delete_tabmark_id];
    update_edit_tabmark_list();
    document.getElementById("it_edit_new_name").value = "";
    clear_select_box(document.getElementById("sb_edit_tab_list"));
}

function delet_tab() {
    var delete_tabmark_id = document.getElementById("sb_edit_tabmark_list").value;
    var delete_tab_id = document.getElementById("sb_edit_tab_list").value;
    delete tabmark_list[delete_tabmark_id].data.splice(delete_tab_id, 1);
    update_edit_tablist();
}

function update_edit_tabmark_list() {
    set_tabmark_list_for_select_box("sb_edit_tabmark_list");
}

function update_edit_tablist() {
    var select_tabmark_id = document.getElementById("sb_edit_tabmark_list").value;
    var select = document.getElementById("sb_edit_tab_list");
    
    clear_select_box( select );
    
    var tab_data = tabmark_list[select_tabmark_id].data;
    for( var tab_index = 0; tab_index < tab_data.length; tab_index++ ) {
        var option = document.createElement("option");
        option.text = tab_data[tab_index].name;
        option.value = tab_index;
        select.appendChild(option);
    }
}

/* ===== Common functions ===== */
function set_tabmark_list_for_select_box( select_box_id ) {
    var select = document.getElementById(select_box_id);
    
    clear_select_box( select );
    
    for( id in tabmark_list ) {
        var option = document.createElement("option");
        option.text = tabmark_list[id].name;
        option.value = id;
        select.appendChild(option);
    }
}

function get_tabmark_list() {
    try {
        return JSON.parse( localStorage["tabmark"] );
    }
    catch(e) {
        return {};
    }
}

function save_tabmark_list( json_data ) {
    localStorage["tabmark"] = JSON.stringify( json_data );
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

/* ===== For development ===== */
function store_test_data() {
    var test_tabmark_list = {
                        20191020114500: {
                            name: "browser",
                            data: [
                                    {
                                        name: "google",
                                        url: "https://www.google.com/"
                                    },
                                    {
                                        name: "yahoo",
                                        url: "https://www.yahoo.co.jp/"
                                    }
                                ]
                        },
                        20191020114600: {
                            name: "SNS",
                            data: [
                                    {
                                        name: "twitter",
                                        url: "https://twitter.com/"
                                    },
                                    {
                                        name: "instagram",
                                        url: "https://www.instagram.com/"
                                    }
                                ]
                        }
                    };
    save_tabmark_list(test_tabmark_list);
}
//store_test_data();
