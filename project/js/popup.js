window.onload = function() {
    document.getElementById('btn_restore_open_tabs').addEventListener('click', open_tab_list);
    document.getElementById('btn_save_tabs').addEventListener('click', add_tab_list);

    update_save_tab_list();
    update_save_target_tabmark_list();
    update_restore_tabmark_list();
};

/* ===== Save functions ===== */
function add_tab_list() {
    var tabmark_list = get_tabmark_list();
    var options_tab_list = document.getElementById('sb_save_tab_list').options;
    var save_tab_ids = [];
    for( var i = 0; i < options_tab_list.length; i++ ) {
        if( options_tab_list[i].selected ) {
            save_tab_ids.push( options_tab_list[i].value );
        }
    }
    
    chrome.tabs.query({currentWindow: true}, function( tabs ) {
        var save_target_id = document.getElementById("sb_save_target_tabmark_list").value;
        
        for( var index = 0; index < tabs.length; index++ ) {
            for( var save_tab_index = 0; save_tab_index < save_tab_ids.length; save_tab_index++ ) {
                if( tabs[index].id == save_tab_ids[save_tab_index] ) {
                    tabmark_list[save_target_id].data.push({ name: tabs[index].title, url: tabs[index].url });
                    chrome.tabs.remove(tabs[index].id);
                    break;
                }
            }
        }
        save_tabmark_list( tabmark_list );
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
    var tabmark_list = get_tabmark_list();
    var options = document.getElementById('sb_restore_tabmark_list').options;
    
    for( var i = 0; i < options.length; i++ ) {
        if( options[i].selected ) {
            console.log(options[i].value);
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

/* ===== Common functions ===== */
function set_tabmark_list_for_select_box( select_box_id ) {
    var tabmark_list = get_tabmark_list();
    var select = document.getElementById(select_box_id);
    
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



/* ===== For development ===== */
function store_test_data() {
    var test_data = {
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
    save_tabmark_list( test_data );
}
store_test_data();
