window.onload = function() {
    document.getElementById('restore_btn_open_tabs').addEventListener('click', open_tab_list);

    update_restore_tabmark_list();
};

/* ===== Restore functions ===== */
function open_tab_list() {
    var tabmark_list = get_tabmark_list();
    var options = document.getElementById('restore_sb_tabmark_list').options;
    
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
    var tabmark_list = get_tabmark_list();
    var select = document.getElementById("restore_sb_tabmark_list");
    
    for( id in tabmark_list ) {
        var option = document.createElement("option");
        option.text = tabmark_list[id].name;
        option.value = id;
        select.appendChild(option);
    }
}

/* ===== Common functions ===== */
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
