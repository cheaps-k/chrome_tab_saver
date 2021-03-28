const REFRESH_PAGE_FUNCTIONS = [refresh_save_page, refresh_restore_page, refresh_edit_page];
const MESSAGE_OPENED_POPUP = "tab_shelf-opened_popup";

const TABGROUP_HANDLING_ON_RESTORE_NOT_AFFECT = 0;
const TABGROUP_HANDLING_ON_RESTORE_DELETE = 1;
const TABGROUP_HANDLING_ON_RESTORE_TO_EMPTY = 2;

const RESTORE_TO_ID_CURRENT_WINDOW_LAST = 0;
const RESTORE_TO_ID_NEW_WINDOW = 1;
const RESTORE_TO_ID_RIGHT_OF_ACTIVE_TAB = 2;

const OPENING_PAGE_SAVE = 0;
const OPENING_PAGE_RESTORE = 1;
const OPENING_PAGE_EDIT = 2;
const OPENING_PAGE_LAST_OPENDED = 3;

let gConfig;
let gTabgroupList;

let gListLastClick = { list: "", row: 0 };

window.onload = () => {
    chrome.runtime.sendMessage( chrome.runtime.id, { message: MESSAGE_OPENED_POPUP } );
    
    set_popup_string();
    
    let pages = document.getElementsByName('tab_item');
    for( page_index = 0; page_index < pages.length; page_index++ ) {
        pages[page_index].addEventListener('change', refresh_page);
    }
    
    document.getElementById('it_save_new_tabgroup').addEventListener('input', input_new_tabgroup_name_to_save);
    document.getElementById('btn_save_tabs').addEventListener('click', save_tab);
    
    document.getElementById('rb_not_affect_to_tabgroup_on_restore').addEventListener('click', change_tabgroup_handling_on_restore);
    document.getElementById('rb_to_empty_tabgroup_on_restore').addEventListener('click', change_tabgroup_handling_on_restore);
    document.getElementById('rb_delete_tabgroup_on_restore').addEventListener('click', change_tabgroup_handling_on_restore);
    document.getElementById('rb_restore_current_window_last').addEventListener('click', change_restore_to);
    document.getElementById('rb_restore_right_of_active_tab').addEventListener('click', change_restore_to);
    document.getElementById('rb_restore_new_window').addEventListener('click', change_restore_to);
    document.getElementById('btn_restore_open_tabs').addEventListener('click', restore_tab_group);
    
    document.getElementById('it_edit_new_name').addEventListener('input', input_new_tabgroup_name_to_rename);
    document.getElementById('btn_edit_rename_tabgroup').addEventListener('click', rename_tabgroup);
    document.getElementById('btn_edit_delete_tabgroup').addEventListener('click', delete_tabgroup);
    document.getElementById('btn_edit_delete_tab').addEventListener('click', delete_tab);
    
    document.getElementById('to_general_setting').addEventListener('click', to_general_setting);
    document.getElementById('return_from_general_setting').addEventListener('click', return_from_general_setting);
    
    let opening_page_elems = document.getElementsByName('opening_page');
    for( let i = 0; i < opening_page_elems.length; i++ ) {
        opening_page_elems[i].addEventListener('click', change_opening_page);
    }
    document.getElementById('setting_display_tab_num_to_tabgroup').addEventListener('click', change_display_setting);
    
    open_start_page();
    
    // 他のウィンドウでpopupが開かれたらウィンドウを閉じる
    chrome.runtime.onMessage.addListener( ( request, sender, callback ) => {
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
    set_element_string('btn_restore_open_tabs', 'restore_page_restore_button');
    set_element_string('legend_restore_setting', 'legend_restore_setting');
    set_element_string('legend_restore_to', 'legend_restore_to');
    set_element_string('restore_page_radio_open_right_of_active_tab', 'restore_page_radio_open_right_of_active_tab');
    set_element_string('restore_page_rb_restore_to_current_window_last', 'restore_page_radio_open_current_window_last');
    set_element_string('restore_page_rb_restore_to_new_window', 'restore_page_radio_open_new_window');
    set_element_string('legend_tabgroup_handling_in_restore', 'legend_tabgroup_handling_in_restore');
    set_element_string('restore_page_rb_tabgroup_handling_on_restore_not_affect', 'restore_page_rb_tabgroup_handling_on_restore_not_affect');
    set_element_string('restore_page_rb_tabgroup_handling_on_restore_to_empty', 'restore_page_rb_tabgroup_handling_on_restore_to_empty');
    set_element_string('restore_page_rb_tabgroup_handling_on_restore_delete', 'restore_page_rb_tabgroup_handling_on_restore_delete');

    set_element_string('edit_page_select_tabgroup', 'edit_page_select_tabgroup');
    set_element_string('btn_edit_delete_tabgroup', 'edit_page_delete_tabgroup_button');
    set_element_string('btn_edit_rename_tabgroup', 'edit_page_rename_tabgroup_button');
    set_element_string('edit_page_select_tab', 'edit_page_select_tab');
    set_element_string('btn_edit_delete_tab', 'edit_page_delete_tab_button');

    set_element_string('to_general_setting', 'to_general_setting');
    set_element_string('general_setting_title', 'general_setting_title');
    
    set_element_string('setting_opening_page', 'setting_opening_page');
    set_element_string('label_opening_page_save', 'label_opening_page_save');
    set_element_string('label_opening_page_restore', 'label_opening_page_restore');
    set_element_string('label_opening_page_edit', 'label_opening_page_edit');
    set_element_string('label_opening_page_last_oepned', 'label_opening_page_last_oepned');

    set_element_string('setting_display', 'setting_display');
    set_element_string('label_display_tab_num_to_tabgroup', 'label_display_tab_num_to_tabgroup');
}

function set_element_string( element_id, message_id ) {
    document.getElementById(element_id).innerHTML = chrome.i18n.getMessage(message_id);
}

/* ===== Page functions ===== */
function open_start_page() {
    event_start();
    
    if( gConfig["opening_page"] == OPENING_PAGE_LAST_OPENDED ) {
        document.getElementsByName('tab_item')[gConfig["last_opened_page"]].checked = true;
    } else {
        document.getElementsByName('tab_item')[gConfig["opening_page"]].checked = true;
    }
    
    refresh_page();
    
    event_end();
}

function refresh_page() {
    event_start();
    
    let pages = document.getElementsByName('tab_item');
    for( page_index = 0; page_index < pages.length; page_index++ ) {
        if( pages[page_index].checked ) {
            REFRESH_PAGE_FUNCTIONS[page_index]();
            gConfig["last_opened_page"] = page_index;
            break;
        }
    }
    
    event_end();
}

async function refresh_save_page() {
    await refresh_save_tab_list();
    refresh_save_target_tabgroup_list();
    refresh_new_tabgroup_name_to_save();
    refresh_save_button_state();
}

function refresh_restore_page() {
    refresh_restore_tabgroup_list();
    refresh_restore_button_state();
    refresh_restore_to();
    refresh_tabgroup_handling_on_restore();
}

async function refresh_edit_page() {
    await refresh_edit_tabgroup_list();
    refresh_edit_new_tabgroup_name();
    refresh_edit_tab_list();
    refresh_edit_buttons();
}

/* ===== Save functions ===== */
async function save_tab() {
    event_start();
    
    /* Get tab list to save */
    let save_tab_ids = [];
    let rows = document.getElementById("tbl_save_tab_list").getElementsByTagName("tbody")[0].getElementsByTagName("tr");
    for( i = 0; i < rows.length; i++ ) {
        if( rows[i].getElementsByTagName("input")[0].checked ) {
            save_tab_ids.push( Number( rows[i].getElementsByClassName("id_cell")[0].innerHTML ) );
        }
    }
    
    /* Save tabs */
    let save_target_id;
    let new_tabgroup;
    
    let tabs = await get_opening_tabs();
    
    new_tabgroup = document.getElementById('it_save_new_tabgroup').value;
    if( new_tabgroup == "" ) {
        /* 既存タブグループへの保存 */
        let rows = document.getElementById("tbl_save_target_tabgroup_list").getElementsByTagName("tbody")[0].getElementsByTagName("tr");
        for( i = 0; i < rows.length; i++ ) {
            if( rows[i].getElementsByTagName("input")[0].checked ) {
                save_target_id = rows[i].getElementsByClassName("id_cell")[0].innerHTML;
                break;
            }
        }
    } else {
        /* 新規タブグループへの保存 */
        save_target_id = get_new_id();
        gTabgroupList[save_target_id] = { name: new_tabgroup, data: [] };
    }
    
    for( let index = 0; index < tabs.length; index++ ) {
        if( save_tab_ids.indexOf( tabs[index].id ) != -1 ) {
            gTabgroupList[save_target_id].data.push({ name: tabs[index].title, url: tabs[index].url, fav_icon: tabs[index].favIconUrl });
        }
    }
    
    /* If selected all tabs, open new tab */
    let remain_tabs_num = tabs.length - save_tab_ids.length;
    if( remain_tabs_num == 0 ) {
        await open_tab( "chrome://newtab/", chrome.windows.WINDOW_ID_CURRENT, 0 );
        remain_tabs_num = 1;
    }
    
    /* Close tabs */
    save_all_nvdata();      // タブを閉じたときにpopupが閉じる可能性があるので、事前にデータを保存しておく
    await close_tabs( save_tab_ids );
    
    // タブを閉じた直後に更新するとタブが残っているように見えるため、タブが閉じきるまでウェイト
    let after_close_tabs;
    for( let limit = 0; limit < 10000; limit++ ){    // 念のため上限を付ける
        after_close_tabs = await get_opening_tabs();
        if( after_close_tabs.length == remain_tabs_num ){
            break;
        }
    }
    refresh_save_page();
    
    event_end();
}

function input_new_tabgroup_name_to_save() {
    event_start();
    
    refresh_save_target_tabgroup_list();
    refresh_save_button_state();
    
    event_end();
}

async function refresh_save_tab_list() {
    let table_id = "tbl_save_tab_list";
    
    let tabs = await get_opening_tabs();
    let table_body = document.getElementById(table_id).getElementsByTagName("tbody")[0];
    let row_data = [{ class: 'checkbox_cell', value: '<input type="checkbox">'}, { class: 'fav_icon_cell', value: '' }, { class: 'title_cell', value: ''}, { class: 'row_cell', value: '' }, { class: 'id_cell', value: ''}];

    table_body.innerHTML = "";
    for( let index = 0; index < tabs.length; index++ ) {
        let escaped_title = escape_string( tabs[index].title );
        
        if( tabs[index].favIconUrl ) {
            row_data[1].value = `<img src="${tabs[index].favIconUrl}" class="fav_icon">`;
        } else {
            row_data[1].value = "";
        }
        row_data[2].value = escaped_title;
        row_data[3].value = String( index );
        row_data[4].value = tabs[index].id;
        
        table_body.innerHTML += make_table_row( escaped_title, row_data );
    }
    register_event_to_save_tab_list();
    
    if( gListLastClick.list == table_id ) {
        gListLastClick.list = "";
    }
}

function register_event_to_save_tab_list() {
    let rows = document.getElementById("tbl_save_tab_list").getElementsByTagName("tbody")[0].getElementsByTagName("tr");
    for( i = 0; i < rows.length; i++ ) {
        rows[i].addEventListener('click', select_save_tab_list);
    }
}

function select_save_tab_list(e) {
    event_start();

    multi_list_selected(this, e, "tbl_save_tab_list");
    refresh_save_button_state();

    event_end();
}

function refresh_save_target_tabgroup_list() {
    let table_id = "tbl_save_target_tabgroup_list";
    
    let table = document.getElementById(table_id);
    let table_body = table.getElementsByTagName("tbody")[0];
    let row_data = [{ class: 'radiobutton_cell', value: '<input type="radio" name="rd_save_target_tabgroup">'}, { class: 'title_cell', value: ''}, { class: 'num_cell', value: '' }, { class: 'row_cell', value: '' }, { class: 'id_cell', value: ''}];

    table_body.innerHTML = "";
    let counter = 0;
    for( id in gTabgroupList ) {
        let escaped_title = escape_string( gTabgroupList[id].name );
        
        row_data[1].value = escaped_title;
        row_data[2].value = gTabgroupList[id].data.length;
        row_data[3].value = String( counter );
        row_data[4].value = id;
        
        table_body.innerHTML += make_table_row( escaped_title, row_data );
        
        counter++;
    }
    register_event_to_save_target_tabgroup_list();
    
    if( gListLastClick.list == table_id ) {
        gListLastClick.list = "";
    }
    
    reflesh_tab_num_of_tab_group( table );
}

function register_event_to_save_target_tabgroup_list() {
    let rows = document.getElementById("tbl_save_target_tabgroup_list").getElementsByTagName("tbody")[0].getElementsByTagName("tr");
    for( i = 0; i < rows.length; i++ ) {
        rows[i].addEventListener('click', select_save_target_tabgroup_list);
    }
}

function select_save_target_tabgroup_list(e) {
    event_start();

    single_list_selected(this, e, "tbl_save_target_tabgroup_list");
    document.getElementById('it_save_new_tabgroup').value = "";
    refresh_save_button_state();

    event_end();
}

function refresh_new_tabgroup_name_to_save() {
    document.getElementById('it_save_new_tabgroup').value = "";
}

function refresh_save_button_state() {
    document.getElementById('btn_save_tabs').disabled = !is_save_enable();
}

function is_save_enable() {
    let rtn = false;
    
    let is_select_save_tab = false;
    let save_tab_selects = document.getElementById("tbl_save_tab_list").getElementsByTagName("input");
    for( i = 0; i < save_tab_selects.length; i++ ) {
        if( save_tab_selects[i].checked ) {
            is_select_save_tab = true;
            break;
        }
    }
    
    if( is_select_save_tab ) {
        let is_select_save_target_tabgroup = false;
        let save_target_tabgroup_selects = document.getElementById("tbl_save_target_tabgroup_list").getElementsByTagName("input");
        for( i = 0; i < save_target_tabgroup_selects.length; i++ ) {
            if( save_target_tabgroup_selects[i].checked ) {
                is_select_save_target_tabgroup = true;
                break;
            }
        }
        
        if( ( is_select_save_target_tabgroup )
         || ( document.getElementById('it_save_new_tabgroup').value != "" ) ) {
            rtn = true;
        }
    }
    
    return rtn;
}

/* ===== Restore functions ===== */
function change_tabgroup_handling_on_restore() {
    event_start();
    
    if( document.getElementById('rb_not_affect_to_tabgroup_on_restore').checked ) {
        gConfig["tabgroup_handling_on_restore"] = TABGROUP_HANDLING_ON_RESTORE_NOT_AFFECT;
    } else if ( document.getElementById('rb_delete_tabgroup_on_restore').checked ) {
        gConfig["tabgroup_handling_on_restore"] = TABGROUP_HANDLING_ON_RESTORE_DELETE;
    } else if ( document.getElementById('rb_to_empty_tabgroup_on_restore').checked ) {
        gConfig["tabgroup_handling_on_restore"] = TABGROUP_HANDLING_ON_RESTORE_TO_EMPTY;
    }
    
    event_end();
}

function change_restore_to() {
    event_start();
    
    if( document.getElementById('rb_restore_current_window_last').checked ) {
        gConfig["restore_to"] = RESTORE_TO_ID_CURRENT_WINDOW_LAST;
    } else if ( document.getElementById('rb_restore_right_of_active_tab').checked ) {
        gConfig["restore_to"] = RESTORE_TO_ID_RIGHT_OF_ACTIVE_TAB;
    } else if ( document.getElementById('rb_restore_new_window').checked ) {
        gConfig["restore_to"] = RESTORE_TO_ID_NEW_WINDOW;
    }
    
    event_end();
}

function restore_tab_group() {
    event_start();
    
    let restore_tabgroup_id_list = get_select_value_from_list(document.getElementById('tbl_restore_tabgroup_list'), "id_cell");
    let is_popup_close = false;
    
    let is_open_new_window = false;
    let is_open_last_pos = true;
    if( gConfig["restore_to"] == RESTORE_TO_ID_NEW_WINDOW ) { 
        is_open_new_window = true;
        is_popup_close = true;
    } else if ( gConfig["restore_to"] == RESTORE_TO_ID_RIGHT_OF_ACTIVE_TAB ) {
        is_open_last_pos = false;
    }
    
    for( let i = 0; i < restore_tabgroup_id_list.length; i++ ) {
        let tabgroup_id = restore_tabgroup_id_list[i];
        let tabgroup_data = gTabgroupList[tabgroup_id].data;
        
        open_tabs( tabgroup_data, is_open_new_window, is_open_last_pos );
        
        if( gConfig["tabgroup_handling_on_restore"] == TABGROUP_HANDLING_ON_RESTORE_DELETE ) {
            delete gTabgroupList[tabgroup_id];
        } else if( gConfig["tabgroup_handling_on_restore"] == TABGROUP_HANDLING_ON_RESTORE_TO_EMPTY ) {
            gTabgroupList[tabgroup_id].data = [];
        }
    }
    
    refresh_restore_page();
    
    event_end();
    
    if( is_popup_close ) {
        window.close();
    }
}

async function open_tabs( tabgroup_data, is_open_new_window, is_open_last_pos ) {
    if( tabgroup_data.length > 0 ) {
        let window_id;
        let tab_index;
        
        if( is_open_new_window ) {
            window_id = await open_window( tabgroup_data[0].url );
            tabgroup_data = tabgroup_data.slice( 1 );   // ウィンドウを開くときに1つ目のタブは開くため、削除する
            tab_index = 1;
        } else {
            window_id = chrome.windows.WINDOW_ID_CURRENT;
            if( is_open_last_pos ) {
                let opneing_tabs = await get_opening_tabs();
                tab_index = opneing_tabs.length;
            } else {
                tab_index = await get_active_tab_index() + 1;
            }
        }
        
        for( let data_index = 0; data_index < tabgroup_data.length; data_index++ ) {
            await open_tab( tabgroup_data[data_index].url, window_id, tab_index );
            tab_index++;
        }
    }
}

function refresh_restore_tabgroup_list() {
    let table_id = "tbl_restore_tabgroup_list";
    
    let table = document.getElementById(table_id);
    let table_body = table.getElementsByTagName("tbody")[0];
    let row_data = [{ class: 'checkbox_cell', value: '<input type="checkbox">'}, { class: 'title_cell', value: ''}, { class: 'num_cell', value: '' }, { class: 'row_cell', value: '' }, { class: 'id_cell', value: ''}];

    table_body.innerHTML = "";
    let counter = 0;
    for( id in gTabgroupList ) {
        let escaped_title = escape_string( gTabgroupList[id].name );
        
        row_data[1].value = escaped_title;
        row_data[2].value = gTabgroupList[id].data.length;
        row_data[3].value = String( counter );
        row_data[4].value = id;
        
        table_body.innerHTML += make_table_row( escaped_title, row_data );
        
        counter++;
    }
    register_event_to_restore_tabgroup_list();
    
    if( gListLastClick.list == table_id ) {
        gListLastClick.list = "";
    }

    reflesh_tab_num_of_tab_group( table );
}

function register_event_to_restore_tabgroup_list() {
    let rows = document.getElementById("tbl_restore_tabgroup_list").getElementsByTagName("tbody")[0].getElementsByTagName("tr");
    for( i = 0; i < rows.length; i++ ) {
        rows[i].addEventListener('click', select_restore_tabgroup_list);
    }
}

function select_restore_tabgroup_list(e) {
    event_start();

    multi_list_selected(this, e, "tbl_restore_tabgroup_list");
    refresh_restore_button_state();

    event_end();
}

function refresh_tabgroup_handling_on_restore() {
    if( gConfig["tabgroup_handling_on_restore"] == TABGROUP_HANDLING_ON_RESTORE_NOT_AFFECT ) {
        document.getElementById('rb_not_affect_to_tabgroup_on_restore').checked = true;
    } else if( gConfig["tabgroup_handling_on_restore"] == TABGROUP_HANDLING_ON_RESTORE_DELETE ) {
        document.getElementById('rb_delete_tabgroup_on_restore').checked = true;
    } else if( gConfig["tabgroup_handling_on_restore"] == TABGROUP_HANDLING_ON_RESTORE_TO_EMPTY ) {
        document.getElementById('rb_to_empty_tabgroup_on_restore').checked = true;
    }
}

function refresh_restore_to() {
    if( gConfig["restore_to"] == RESTORE_TO_ID_CURRENT_WINDOW_LAST ) {
        document.getElementById('rb_restore_current_window_last').checked = true;
    } else if( gConfig["restore_to"] == RESTORE_TO_ID_RIGHT_OF_ACTIVE_TAB ) {
        document.getElementById('rb_restore_right_of_active_tab').checked = true;
    } else if( gConfig["restore_to"] == RESTORE_TO_ID_NEW_WINDOW ) {
        document.getElementById('rb_restore_new_window').checked = true;
    }
}

function refresh_restore_button_state() {
    document.getElementById('btn_restore_open_tabs').disabled = !is_restore_enable();
}

function is_restore_enable() {
    let rtn = false;
    
    if( is_selected_list( document.getElementById("tbl_restore_tabgroup_list") ) ) {
        rtn = true;
    }
    
    return rtn;
}

/* ===== Edit functions ===== */
function input_new_tabgroup_name_to_rename() {
    event_start();
    
    refresh_edit_buttons();
    
    event_end();
}

function rename_tabgroup() {
    event_start();
    
    let new_name = document.getElementById("it_edit_new_name").value;
    let rename_tabgroup_id = get_select_value_from_list(document.getElementById("tbl_edit_tabgroup_list"), "id_cell")[0];
    gTabgroupList[rename_tabgroup_id].name = new_name;
    refresh_edit_page();
    
    event_end();
}

function delete_tabgroup() {
    event_start();
    
    let delete_tabgroup_id = get_select_value_from_list(document.getElementById("tbl_edit_tabgroup_list"), "id_cell")[0];
    delete gTabgroupList[delete_tabgroup_id];
    refresh_edit_page();
    
    event_end();
}

function delete_tab() {
    event_start();
    
    let tabgroup_list_table = document.getElementById("tbl_edit_tabgroup_list");
    let delete_tabgroup_id = get_select_value_from_list(tabgroup_list_table, "id_cell")[0];
    let tab_num = get_select_value_from_list(tabgroup_list_table, "num_cell")[0];
    let tab_index;
    
    let rows = document.getElementById("tbl_edit_tab_list").getElementsByTagName("tbody")[0].getElementsByTagName("tr");
    for( i = rows.length - 1; i >= 0; i-- ) {   // 配列要素を削除していくので、後ろからサーチする
        if( rows[i].getElementsByTagName("input")[0].checked ) {
            tab_index = Number( rows[i].getElementsByClassName("id_cell")[0].innerHTML );
            delete gTabgroupList[delete_tabgroup_id].data.splice(i, 1);
            tab_num--;
        }
    }
    
    change_value_to_select_list(tabgroup_list_table, "num_cell", tab_num);
    refresh_edit_tab_list();
    
    event_end();
}

async function refresh_edit_tabgroup_list() {
    let table_id = "tbl_edit_tabgroup_list";
    
    let tabs = await get_opening_tabs();
    let table = document.getElementById(table_id);
    let table_body = table.getElementsByTagName("tbody")[0];
    let row_data = [{ class: 'radiobutton_cell', value: '<input type="radio" name="rd_save_target_tabgroup">'}, { class: 'title_cell', value: ''}, { class: 'num_cell', value: '' }, { class: 'row_cell', value: '' }, { class: 'id_cell', value: ''}];

    table_body.innerHTML = "";
    let counter = 0;
    for( id in gTabgroupList ) {
        let escaped_title = escape_string( gTabgroupList[id].name );
        
        row_data[1].value = escaped_title;
        row_data[2].value = gTabgroupList[id].data.length;
        row_data[3].value = String( counter );
        row_data[4].value = id;
        
        table_body.innerHTML += make_table_row( escaped_title, row_data );
        
        counter++;
    }
    register_event_to_edit_tabgroup_list();
    
    if( gListLastClick.list == table_id ) {
        gListLastClick.list = "";
    }

    reflesh_tab_num_of_tab_group( table );
}

function register_event_to_edit_tabgroup_list() {
    let rows = document.getElementById("tbl_edit_tabgroup_list").getElementsByTagName("tbody")[0].getElementsByTagName("tr");
    for( i = 0; i < rows.length; i++ ) {
        rows[i].addEventListener('click', select_edit_tabgroup_list);
    }
}

function select_edit_tabgroup_list(e) {
    event_start();

    single_list_selected(this, e, "tbl_edit_tabgroup_list");

    let rows = document.getElementById("tbl_edit_tabgroup_list").getElementsByTagName("tbody")[0].getElementsByTagName("tr");
    let edit_new_name = get_select_value_from_list(document.getElementById("tbl_edit_tabgroup_list"), "title_cell");
    document.getElementById("it_edit_new_name").value = edit_new_name;

    refresh_edit_tab_list();
    refresh_edit_buttons();

    event_end();
}

function refresh_edit_new_tabgroup_name() {
    document.getElementById('it_edit_new_name').value = "";
}

function refresh_edit_tab_list() {
    let select_tabgroup_id = '';
    let select_tabgroup_id_list = get_select_value_from_list(document.getElementById("tbl_edit_tabgroup_list"), "id_cell");
    if( select_tabgroup_id_list.length > 0 ) {
        select_tabgroup_id = select_tabgroup_id_list[0];
    }
    
    let table_id = "tbl_edit_tab_list";
    let table_body = document.getElementById(table_id).getElementsByTagName("tbody")[0];
    let row_data = [{ class: 'checkbox_cell', value: '<input type="checkbox">'}, { class: 'fav_icon_cell', value: '' }, { class: 'title_cell', value: ''}, { class: 'row_cell', value: '' }, { class: 'id_cell', value: ''}];
    
    table_body.innerHTML = "";
    if( select_tabgroup_id != "" ) {
        let tab_data = gTabgroupList[select_tabgroup_id].data;
        for( let tab_index = 0; tab_index < tab_data.length; tab_index++ ) {
            let escaped_title = escape_string( tab_data[tab_index].name );
            
            if( tab_data[tab_index].fav_icon ) {
                row_data[1].value = `<img src="${tab_data[tab_index].fav_icon}" class="fav_icon">`;
            } else {
                row_data[1].value = "";
            }
            row_data[2].value = escaped_title;
            row_data[3].value = String( tab_index );
            row_data[4].value = tab_index;
            
            table_body.innerHTML += make_table_row( escaped_title, row_data );
        }
    }
    register_event_to_edit_tab_list();
    
    if( gListLastClick.list == table_id ) {
        gListLastClick.list = "";
    }
}

function register_event_to_edit_tab_list() {
    let rows = document.getElementById("tbl_edit_tab_list").getElementsByTagName("tbody")[0].getElementsByTagName("tr");
    for( i = 0; i < rows.length; i++ ) {
        rows[i].addEventListener('click', select_edit_tab_list);
    }
}

function select_edit_tab_list(e) {
    event_start();

    multi_list_selected(this, e, "tbl_edit_tab_list");
    refresh_edit_buttons();

    event_end();
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
    let rtn = false;
    
    if( ( is_selected_list( document.getElementById("tbl_edit_tabgroup_list") ) )
     && ( document.getElementById("it_edit_new_name").value != "" ) ) {
        rtn = true;
    }
    
    return rtn;
}

function refresh_delete_tabgroup_button_state() {
    document.getElementById('btn_edit_delete_tabgroup').disabled = !is_delete_tabgroup_enable();
}

function is_delete_tabgroup_enable() {
    let rtn = false;
    
    if( is_selected_list( document.getElementById("tbl_edit_tabgroup_list") ) ) {
        rtn = true;
    }
    
    return rtn;
}

function refresh_delete_tab_button_state() {
    document.getElementById('btn_edit_delete_tab').disabled = !is_delete_tab_enable();
}

function is_delete_tab_enable() {
    let rtn = false;
    
    if( ( is_selected_list( document.getElementById("tbl_edit_tabgroup_list") ) )
     && ( is_selected_list( document.getElementById("tbl_edit_tab_list") ) ) ) {
        rtn = true;
    }
    
    return rtn;
}

/* ===== General Setting functions ===== */
function to_general_setting() {
    event_start();
    
    document.getElementById("rd_content_setting").checked = true;
    refresh_general_setting();
    
    event_end();
}

function return_from_general_setting() {
    event_start();
    
    document.getElementById("rd_content_main").checked = true;
    refresh_page();
    
    event_end();
}

function change_opening_page() {
    event_start();
    
    if( document.getElementById('rb_opening_page_save').checked ) {
        gConfig["opening_page"] = OPENING_PAGE_SAVE;
    } else if ( document.getElementById('rb_opening_page_restore').checked ) {
        gConfig["opening_page"] = OPENING_PAGE_RESTORE;
    } else if ( document.getElementById('rb_opening_page_edit').checked ) {
        gConfig["opening_page"] = OPENING_PAGE_EDIT;
    } else if ( document.getElementById('rb_opening_page_last_opened').checked ) {
        gConfig["opening_page"] = OPENING_PAGE_LAST_OPENDED;
    }
    
    event_end();
}

function change_display_setting() {
    event_start();
    
    gConfig["display_tab_num_to_tabgroup"] = document.getElementById('setting_display_tab_num_to_tabgroup').checked;
    
    event_end();
}

function refresh_general_setting() {
    if( gConfig["opening_page"] == OPENING_PAGE_SAVE ) {
        document.getElementById('rb_opening_page_save').checked = true;
    } else if( gConfig["opening_page"] == OPENING_PAGE_RESTORE ) {
        document.getElementById('rb_opening_page_restore').checked = true;
    } else if( gConfig["opening_page"] == OPENING_PAGE_EDIT ) {
        document.getElementById('rb_opening_page_edit').checked = true;
    } else if( gConfig["opening_page"] == OPENING_PAGE_LAST_OPENDED ) {
        document.getElementById('rb_opening_page_last_opened').checked = true;
    }
    
    document.getElementById('setting_display_tab_num_to_tabgroup').checked = gConfig["display_tab_num_to_tabgroup"];
}

/* ===== Common functions ===== */
async function get_opening_tabs() {
    return new Promise ( ( resolve, reject ) => {
        chrome.tabs.query( { currentWindow: true }, ( tabs ) => {
            resolve( tabs );
        });
    });
}

async function close_tabs( tab_ids ) {
    return new Promise ( ( resolve, reject ) => {
        chrome.tabs.remove( tab_ids, () => {
            resolve();
        });
    });
}

async function open_window( new_url ) {
    return new Promise ( ( resolve, reject ) => {
        chrome.windows.create( { url: new_url }, ( window ) => {
            resolve( window.id );
        });
    });
}

async function open_tab( new_url, target_window_id, tab_index ) {
    return new Promise ( ( resolve, reject ) => {
        chrome.tabs.create({
            windowId: target_window_id,
            url: new_url,
            index: tab_index,
            active: false
        });
        
        resolve();
    });
}

async function get_active_tab_index() {
    return new Promise ( ( resolve, reject ) => {
        chrome.tabs.query( { active: true, currentWindow: true }, ( tabs ) => {
            resolve( tabs[0].index );
        });
    });
}

function make_table_row( row_title, row_data ) {
    let table_row = `<tr title="${row_title}">`;
    for( index = 0; index < row_data.length; index++ ) {
        table_row += `<td class="${row_data[index].class}">${row_data[index].value}</td>`
    }
    table_row += "</tr>";
    
    return table_row;
}

function multi_list_selected( row, e, table_id ){
    if( gListLastClick.list != table_id ) {
        gListLastClick.list = "";
    }
    let rows = document.getElementById(table_id).getElementsByTagName("tbody")[0].getElementsByTagName("tr");
    if( e.target.type == "checkbox" ) {
        set_click_row( table_id, row, row.getElementsByTagName("input")[0].checked );
    } else if( e.target.className == "checkbox_cell" ) {
        let new_state = !row.getElementsByTagName("input")[0].checked;
        row.getElementsByTagName("input")[0].checked = new_state;
        set_click_row( table_id, row, new_state );
    } else {
        if( e.ctrlKey ) {
            let new_state = !row.getElementsByTagName("input")[0].checked;
            row.getElementsByTagName("input")[0].checked = new_state;
            set_click_row( table_id, row, new_state );
        } else if( e.shiftKey && gListLastClick.list == table_id) {
            for (i = 0; i < rows.length; i++) {
                rows[i].getElementsByTagName("input")[0].checked = false;
            }
            let click_row = row.getElementsByClassName("row_cell")[0].innerHTML;
            for( i = Math.min( click_row, gListLastClick.row ); i <= Math.max( click_row, gListLastClick.row ); i++ ) {
                rows[i].getElementsByTagName("input")[0].checked = true;
            }
        } else {
            for (i = 0; i < rows.length; i++) {
                rows[i].getElementsByTagName("input")[0].checked = false;
            }
            row.getElementsByTagName("input")[0].checked = true;
            
            set_click_row( table_id, row, true );
        }
    }
    reflesh_list_color( rows );
}

function single_list_selected( row, e, table_id ) {
    if( gListLastClick.list != table_id ) {
        gListLastClick.list = "";
    }
    row.getElementsByTagName("input")[0].checked = true;
    
    let rows = document.getElementById(table_id).getElementsByTagName("tbody")[0].getElementsByTagName("tr");
    reflesh_list_color( rows );
}

function set_click_row( table_id, row, is_enable ) {
    if( is_enable ) {
        gListLastClick.list = table_id;
        gListLastClick.row = row.getElementsByClassName("row_cell")[0].innerHTML;
    } else {
        gListLastClick.list = "";
    }
}

function get_select_value_from_list( table, item_name ) {
    let select_values = [];
    let rows = table.getElementsByTagName("tbody")[0].getElementsByTagName("tr");
    for( i = 0; i < rows.length; i++ ) {
        if( rows[i].getElementsByTagName("input")[0].checked ) {
            select_values.push(rows[i].getElementsByClassName(item_name)[0].innerHTML);
        }
    }
    
    return select_values;
}

function change_value_to_select_list( table, item_name, value ) {
    let rows = table.getElementsByTagName("tbody")[0].getElementsByTagName("tr");
    for( i = 0; i < rows.length; i++ ) {
        if( rows[i].getElementsByTagName("input")[0].checked ) {
            rows[i].getElementsByClassName(item_name)[0].innerHTML = value;
        }
    }
    
    return;
}

function is_selected_list( table ) {
    let is_selected = false;
    let rows = table.getElementsByTagName("tbody")[0].getElementsByTagName("tr");
    for( i = 0; i < rows.length; i++ ) {
        if( rows[i].getElementsByTagName("input")[0].checked ) {
            is_selected = true;
            break;
        }
    }
    
    return is_selected;
}

function reflesh_list_color( rows ) {
    for( i = 0; i < rows.length; i++ ) {
        let row = rows[i];
        if( row.getElementsByTagName("input")[0].checked ) {
            row.style.backgroundColor = "#5ab4bd";
        } else {
            row.style.backgroundColor = "#FFFFFF";
        }
    }
}

function reflesh_tab_num_of_tab_group( table ) {
    let display_style = "none";
    if( gConfig["display_tab_num_to_tabgroup"] == true ){
        display_style = "";
    }

    table.getElementsByClassName("list_table_col_tab_num")[0].style.display = display_style;

    let tab_num_cells = table.getElementsByTagName("tbody")[0].getElementsByClassName("num_cell");
    for( let index = 0; index < tab_num_cells.length; index++ ) {
        tab_num_cells[index].style.display = display_style;
    }
}

function escape_string( original_str ) {
    let escaped_str = original_str;
    escaped_str = escaped_str.replace(/&/g, '&amp;');
    escaped_str = escaped_str.replace(/</g, '&lt;');
    escaped_str = escaped_str.replace(/>/g, '&gt;');
    escaped_str = escaped_str.replace(/"/g, '&quot;');
    escaped_str = escaped_str.replace(/ /g, '&nbsp;');
    escaped_str = escaped_str.replace(/\r?\n/g, '');
    
    return escaped_str;
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
    let config_data = read_saved_data( "config" );
    
    if( !( "tabgroup_handling_on_restore" in config_data ) ) {
        config_data["tabgroup_handling_on_restore"] = TABGROUP_HANDLING_ON_RESTORE_NOT_AFFECT;
    }
    if( !( "restore_to" in config_data ) ) {
        config_data["restore_to"] = RESTORE_TO_ID_CURRENT_WINDOW_LAST;
    }
    if( !( "opening_page" in config_data ) ) {
        config_data["opening_page"] = OPENING_PAGE_SAVE;
    }
    if( !( "display_tab_num_to_tabgroup" in config_data ) ) {
        config_data["display_tab_num_to_tabgroup"] = true;
    }
    if( !( "last_opened_page" in config_data ) ) {
        config_data["last_opened_page"] = 0;
    }
    
    config_data = config_convert( config_data );
    
    return config_data;
}

function config_convert(config_data) {
    /* v1.1.1 to v1.2.0 */
    if( "is_empty_on_restore" in config_data ) {
        if( config_data["is_empty_on_restore"] == true ) {
            config_data["tabgroup_handling_on_restore"] = TABGROUP_HANDLING_ON_RESTORE_TO_EMPTY;
        }
        delete config_data["is_empty_on_restore"];
    }
    if( "is_delete_on_restore" in config_data ) {
        if( config_data["is_delete_on_restore"] == true ) {
            config_data["tabgroup_handling_on_restore"] = TABGROUP_HANDLING_ON_RESTORE_DELETE;
        }
        delete config_data["is_delete_on_restore"];
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
    let now = new Date();
    
    let year = number_to_string_with_zero_pad(now.getFullYear(), 4);
    let month = number_to_string_with_zero_pad(now.getMonth() + 1, 2);
    let date = number_to_string_with_zero_pad(now.getDate(), 2);
    let hour = number_to_string_with_zero_pad(now.getHours(), 2);
    let min = number_to_string_with_zero_pad(now.getMinutes(), 2);
    let sec = number_to_string_with_zero_pad(now.getSeconds(), 2);
    let msec = number_to_string_with_zero_pad(now.getMilliseconds(), 3);
    
    return year + month + date + hour + min + sec + msec;
}

function number_to_string_with_zero_pad( num, len ){
    return ( Array(len).join('0') + num ).slice( -len );
}
