$(document).ready(function () {
  //handle form submition validation
  $('#btn-submit').click(validate_form)

  //watch card adding or removal
  $(".cards-container").arrive(".card", function () {
    $(".no-cards-label").addClass('hidden');
  });
  $(".cards-container").leave(".card", function () {
    if ($(".cards-container").children().length == 0) {
      $(".no-cards-label").removeClass('hidden');
    }
  });

  $('.en-only').on('paste', function (e) {
    e.preventDefault();
  });

  $('.ar-only').on('paste', function (e) {
    e.preventDefault();
  });

  $('.en-only').on('keydown', function (e) {
    save_last_key_down(e);
  });

  $('.ar-only').on('keydown', function (e) {
    save_last_key_down(e);
  });

  $('.en-only').on('keypress', function (e) {
    validate_en(e);
  });

  $('.ar-only').on('keypress', function (e) {
    validate_ar(e);
  });

  Date.prototype.toString = function dateToString() {
    return printDate(this)
  };
})

var dtp_locale = {
  localization: {
    today: 'اليوم',
    clear: 'مسح',
    close: 'خروج',
    selectMonth: 'إختر شهر',
    previousMonth: 'الشهر السابق',
    nextMonth: 'الشهر التالي',
    selectYear: 'إختر سنة',
    previousYear: 'السنة السابقة',
    nextYear: 'السنة التالية',
    selectDecade: 'إختر عقد',
    previousDecade: 'العقد السابق',
    nextDecade: 'العقد التالي',
    previousCentury: 'القرن السابق',
    nextCentury: 'القرن التالي',
    pickHour: 'إختر ساعة',
    incrementHour: 'أضف ساعة',
    decrementHour: 'أنقص ساعة',
    pickMinute: 'إختر دقيقة',
    incrementMinute: 'أضف دقيقة',
    decrementMinute: 'أنقص دقيقة',
    pickSecond: 'إختر ثانية',
    incrementSecond: 'أضف ثانية',
    decrementSecond: 'أنقص ثانية',
    toggleMeridiem: 'صباحاً/مساءاً',
    selectTime: 'إختر وقت',
    selectDate: 'إختر تاريخ',
    dayViewHeaderFormat: { month: 'long', year: '2-digit' },
    locale: 'ar-ae',
    startOfTheWeek: 1
  }
}

function validate_form(e) {
  var form = document.getElementById('myform')
  if (!form.checkValidity()) {
    e.preventDefault();
    e.stopPropagation();
    form.classList.add('was-validated')
    showError('الرجاء التأكد من تعبئة كل الخانات المطلوبة');
    return false
  }
  return true
}

let last_key_down_event_code = 0;

function save_last_key_down(e) {
  last_key_down_event_code = e.keyCode
  setTimeout(function () {
    last_key_down_event_code = 0
  }, 200);
}

function validate_en(evt) {
  var ar_to_en_dic = {
    'ض': 'q',
    'ص': 'w',
    'ث': 'e',
    'ق': 'r',
    'ف': 't',
    'غ': 'y',
    'ع': 'u',
    'ه': 'i',
    'خ': 'o',
    'ح': 'p',
    'ش': 'a',
    'س': 's',
    'ي': 'd',
    'ب': 'f',
    'ل': 'g',
    'ا': 'h',
    'ت': 'j',
    'ن': 'k',
    'م': 'l',
    'ئ': 'z',
    'ء': 'x',
    'ؤ': 'c',
    'ر': 'v',
    'لا': 'b',
    'ى': 'n',
    'ة': 'm',
  };
  var theEvent = evt || window.event;
  var key = theEvent.keyCode || theEvent.which;
  key = String.fromCharCode(key);
  if (key == ' ') {
    theEvent.returnValue = false;
    if (theEvent.preventDefault) theEvent.preventDefault();
    replaceKey($(evt.target), '_')
  } else {
    var regex = /[a-zA-Z0-9_]/;
    if (typeof ar_to_en_dic[key.toLowerCase()] !== 'undefined') {
      if (last_key_down_event_code == 66 && ar_to_en_dic[key.toLowerCase()] == 'h') {
        last_key_down_event_code = 0
      } else if (last_key_down_event_code == 66) {
        replaceKey($(evt.target), 'b')
      } else {
        replaceKey($(evt.target), ar_to_en_dic[key.toLowerCase()])
      }
      theEvent.returnValue = false;
      if (theEvent.preventDefault) theEvent.preventDefault();
    } else if (!regex.test(key)) {
      theEvent.returnValue = false;
      if (theEvent.preventDefault) theEvent.preventDefault();
    } else {
      if (key != key.toLowerCase()) {
        theEvent.returnValue = false;
        if (theEvent.preventDefault) theEvent.preventDefault();
        replaceKey($(evt.target), key.toLowerCase())
      } else {
        theEvent.returnValue = true;
        return true;
      }
    }
  }
}

function replaceKey(input, key) {
  var cursorPos = input.prop('selectionStart');
  var v = input.val();
  var textBefore = v.substring(0, cursorPos);
  var textAfter = v.substring(input.prop('selectionEnd'), v.length);

  input.val(textBefore + key + textAfter);
  //input.append(key.charAt(0)).focus();
  //input.trigger({type: 'keydown', which: key.charCodeAt(0), keyCode: key.charCodeAt(0)});
}

function validate_ar(evt) {
  var en_to_ar_dic = {
    'q': 'ض',
    'w': 'ص',
    'e': 'ث',
    'r': 'ق',
    't': 'ف',
    'y': 'غ',
    'u': 'ع',
    'i': 'ه',
    'o': 'خ',
    'p': 'ح',
    '[': 'ج',
    ']': 'د',
    'a': 'ش',
    's': 'س',
    'd': 'ي',
    'f': 'ب',
    'g': 'ل',
    'h': 'ا',
    'j': 'ت',
    'k': 'ن',
    ';': 'ك',
    '\'': 'ط',
    'l': 'م',
    'z': 'ئ',
    'x': 'ء',
    'c': 'ؤ',
    'v': 'ر',
    'b': 'لا',
    'n': 'ى',
    'm': 'ة',
    ',': 'و',
    '.': 'ز',
    '/': 'ظ',
    '`': 'ذ'
  };
  var theEvent = evt || window.event;
  var key = theEvent.keyCode || theEvent.which;
  key = String.fromCharCode(key);
  if (key == ' ') {
    replaceKey($(evt.target), '_')
    theEvent.returnValue = false;
    if (theEvent.preventDefault) theEvent.preventDefault();
  } else if (typeof en_to_ar_dic[key.toLowerCase()] !== 'undefined') {
    theEvent.returnValue = false;
    if (theEvent.preventDefault) theEvent.preventDefault();
    replaceKey($(evt.target), en_to_ar_dic[key.toLowerCase()])
  } else {
    var regex = /[\u0621-\u064A0-9_]/;
    if (!regex.test(key)) {
      theEvent.returnValue = false;
      if (theEvent.preventDefault) theEvent.preventDefault();
    }
  }
}

function showOverlay() {
  document.getElementById("overlay").style.display = "flex";
}

function hideOverlay() {
  document.getElementById("overlay").style.display = "none";
}

function get_ajax_success_function(action, url, success_function) {
  // handle a successful response
  return function (json) {
    hideOverlay();

    if (json['code'] == '0') {
      if (typeof action !== 'undefined' && typeof url !== 'undefined') {
        if (action == 'add' || 'edit') {
          setTimeout(function () {
            document.location.href = url;
          }, 1500);
        } else {
          $('#btn-submit').prop('disabled', false);
        }
      }
      if (typeof success_function !== 'undefined') {
        success_function()
      }
      showSuccess(json['message']);
    } else {
      $('#btn-submit').prop('disabled', false);
      showError(json['message']);
    }
  }
}

function showSuccess(message) {
  document.getElementsByClassName('toast-header')[0].style = 'background-color: deepskyblue'
  document.getElementsByClassName('me-auto')[0].innerHTML = 'نجاح';
  document.getElementsByClassName('toast-body')[0].innerHTML = message
  const toast = new bootstrap.Toast(document.getElementById('liveToast'));
  toast.show()
}

function showError(message) {
  if(message==null || message.trim().length==0)
    message = "الرجاء التأكد من الشبكة"
  document.getElementsByClassName('toast-header')[0].style = 'background-color: lightcoral'
  document.getElementsByClassName('me-auto')[0].innerHTML = 'خطأ';
  document.getElementsByClassName('toast-body')[0].innerHTML = message
  const toast = new bootstrap.Toast(document.getElementById('liveToast'));
  toast.show()
}

function get_ajax_error_function() {
  // handle a non-successful response
  return function (xhr, errmsg, err) {
    hideOverlay();
    showError(err);
    console.log(xhr.status + ": " + xhr.responseText);
    $('#btn-submit').prop('disabled', false);
    stop_process_timer();
  }
}

function update_button_delete_data(e) {
  var button = $(e.delegateTarget)
  var entityid = button.attr('data-entityid')
  $('#button-confirm-delete').attr('data-entityid', entityid)
}

function delete_confirmed(url, csrf_token, e) {
  var button = $(e.target)
  var entityid = button.attr('data-entityid')
  delete_entity(url, csrf_token, entityid)
}

function update_button_reset_password(e) {
  var button = $(e.delegateTarget)
  var entityid = button.attr('data-entityid')
  $('#button-confirm-reset').attr('data-entityid', entityid)
}

function reset_confirmed(csrf_token, e) {
  var button = $(e.target)
  var entityid = button.attr('data-entityid')
  change_password(csrf_token, entityid)
}

// AJAX for posting
function delete_entity(url, csrf_token, entityid) {
  showOverlay();
  $.ajax({
    url: url, // the endpoint
    type: "POST", // http method
    data: {
      csrfmiddlewaretoken: csrf_token,
      action: 'delete',
      entityid: entityid
    }, // data sent with the post request

    success: get_ajax_success_function(undefined, undefined, function () {
      document.getElementById('card-' + entityid).remove();
      document.getElementById('navitem-' + url.split('/')[1] + '-' + entityid).remove();
      if (url == '/databases/' && $(".cards-container").children().length == 0) {
        setTimeout(function () {
          document.location.href = url;
        }, 1000);
      }
    }),

    error: get_ajax_error_function()
  });
};

function show_change_password_dialog() {
  $('#change_pass_error_label')[0].innerText = null;
  $('#id_new_password').val(null)
  $('#id_confirm_password').val(null)
  $('#changePassModal').modal('show')
}

function change_password(csrf_token, userid) {
  showOverlay();
  $.ajax({
    url: '/', // the endpoint
    type: "POST", // http method
    data: {
      csrfmiddlewaretoken: csrf_token,
      action: 'change_password',
      userid: userid,
      new_password: ((userid == null) ? $('#id_new_password').val() : '123456789'),
      confirm_password: ((userid == null) ? $('#id_confirm_password').val() : '123456789')
    }, // data sent with the post request

    success: function (json) {
      hideOverlay();
      if (json['code'] == '0') {
        $('#changePassModal').modal('hide')
        showSuccess(json['message']);
      } else {
        $('#change_pass_error_label')[0].innerText = json['message'];
        showError(json['message']);
      }
    },
    error: function (xhr, errmsg, err) {
      hideOverlay();
      showError(err);
      console.log(xhr.status + ": " + xhr.responseText);
    }
  });
};

function createTable(tableData) {
  var table = document.createElement('table');
  table.classList = "table table-striped"
  var tableHead = document.createElement('thead');
  tableHead.style = "background-color: #dfdfdf !important;";
  var tableBody = document.createElement('tbody');

  tableData.forEach(function (rowData, index) {
    var row = document.createElement('tr');

    var c_ = document.createElement('th');
    c_.appendChild(document.createTextNode(index == 0 ? '#' : index));
    row.appendChild(c_);

    rowData.forEach(function (cellData) {
      var cell = document.createElement(index == 0 ? 'th' : 'td');
      cell.classList = "ellipsis"
      cell.style = "max-width:100px"
      if (index > 1 && index == tableData.length - 1)
        cellData = '...';
      cell.appendChild(document.createTextNode(cellData));
      row.appendChild(cell);
    });

    if (index == 0)
      tableHead.appendChild(row)
    else
      tableBody.appendChild(row);
  });

  table.appendChild(tableHead);
  table.appendChild(tableBody);
  return table;
}

function printDate(date) {
  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const HH = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${dd}/${MM}/${yyyy} ${HH}:${mm}:${ss}`
}

function buildDevexpressTables(k, v, api_url, crf_token, container_id, selection_mode, page_size) {

  parseDataDates(v['columns'], v['data']);
  addEditDeleteColum(v.columns);

  masterDetail_ = {}
  if (v.type == 'edge') {
    masterDetail_ = buildEdgeMasterDetail(api_url,crf_token);
  }

  $('#' + container_id).append('<div id="div_data_' + k + '"></div>');
  dxDataGrid_id = '#div_data_' + k
  $(dxDataGrid_id).dxDataGrid({
    dataSource: v['data'],
    columns: v['columns'],
    showBorders: false,
    rtlEnabled: true,
    allowColumnResizing: true,
    allowColumnReordering: true,
    rowAlternationEnabled: true,
    masterDetail: masterDetail_,
    grouping: {
      autoExpandAll: true,
    },
    selection: {
      mode: selection_mode,
    },
    sorting: {
      mode: 'multiple',
    },
    filterRow: {
      visible: true,
      applyFilter: 'auto',
    },
    headerFilter: {
      visible: true,
    },
    searchPanel: {
      visible: true,
    },
    groupPanel: {
      visible: true,
    },
    scrolling: {
      rowRenderingMode: 'virtual',
    },
    paging: {
      pageSize: page_size,
    },
    pager: {
      visible: true,
      allowedPageSizes: [10, 20, 50, 100],
      showPageSizeSelector: true,
      showInfo: true,
      showNavigationButtons: true,
    },
    export: {
      enabled: true,
      allowExportSelectedData: true,
    },
    onExporting(e) {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('data');

      DevExpress.excelExporter.exportDataGrid({
        component: e.component,
        worksheet,
        autoFilterEnabled: true,
      }).then(() => {
        workbook.xlsx.writeBuffer().then((buffer) => {
          saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'data.xlsx');
        });
      });
      e.cancel = true;
    }
  });
}


function buildEdgeMasterDetail(api_url,crf_token) {
  return {
    enabled: true,
    template(container, options) {
      $.ajax({
        url: api_url, // the endpoint
        type: "POST", // http method
        data: {
          action: 'get_edge_data',
          from_id: options.data['_from'],
          to_id: options.data['_to'],
          csrfmiddlewaretoken: crf_token,
        },
        success: function (inner_resp) {
          if (inner_resp.constructor == Object && inner_resp['code'] == '1')
            showError(inner_resp['message']);
          else {
            json_result = JSON.parse(inner_resp.message)
            if (Object.keys(json_result).length > 1) {
              fromobj = Object.values(json_result.from.srouces)[0]
              toobj = Object.values(json_result.to.srouces)[0]
              $(container)
                .append('<div class="master-detail-caption">من:<span class="' + fromobj['icon'] + ' pr10" style="padding-left:5px"></span>' + fromobj['ar_name'] + '</div>')

              addEditDeleteColum(fromobj.columns)
              addEditDeleteColum(toobj.columns)
              parseDataDates(fromobj['columns'], fromobj['data']);
              parseDataDates(toobj['columns'], toobj['data']);

              $('<div>')
                .dxDataGrid({
                  columnAutoWidth: true,
                  rtlEnabled: true,
                  showBorders: false,
                  columns: fromobj.columns,
                  dataSource: fromobj.data,
                }).appendTo(container);

              $(container)
                .append('<div class="master-detail-caption" style="margin-top:15px">إلى:<span class="' + toobj['icon'] + ' pr10" style="padding-left:5px"></span>' + toobj['ar_name'] + '</div>')

              $('<div>')
                .dxDataGrid({
                  columnAutoWidth: true,
                  rtlEnabled: true,
                  showBorders: false,
                  columns: toobj.columns,
                  dataSource: toobj.data,
                }).appendTo(container);
            }
          }
        },
        error: get_ajax_error_function()
      });


    },
  }
}

function addEditDeleteColum(columns) {
  columns[0]={
    type: 'buttons',
    width: 80,
    buttons: [{
      hint: 'حذف',
      icon: 'trash',
      onClick(e) {
        e.component.refresh(true);
        e.event.preventDefault();
      }},
      {
        hint: 'تعديل',
        icon: 'edit',
        onClick(e) {
          e.component.refresh(true);
          e.event.preventDefault();
      }
    }],
  }
}

function parseDataDates(columns, data) {
  columns.forEach((item) => {
    if (item.dataField == '_creation' || item.datatype == 'datetime') {
      data.forEach((entry) => {
        if (entry[item.dataField] != null) {
          try {
            if (typeof entry[item.dataField] == "string") {
              dates = ''
              String(entry[item.dataField]).split(',').forEach((value) => {
                dates += new Date(parseInt(value.trim())) + ', '
              })
              if (dates.includes(','))
                dates = dates.trim().slice(0, -1)

              entry[item.dataField] = dates;
            } else {
              entry[item.dataField] = new Date(entry[item.dataField]);
            }
          } catch (error) {
          }
        }
      })
    }
  })
}
var current_process_timer_interval = 0;
function start_process_timer(){
  current_process_timer_interval = setInterval(myTimer, 1000);
  var start_process_time = new Date()
  const secondsTo_HHMMSS = (seconds) => {
        //format to a readable friendly timer
        let hour = Math.floor(seconds / 3600);
        let minute = Math.floor((seconds % 3600) / 60);
        let second = seconds % 60;
  
        if(hour.toString().length === 1) {
              hour = `0${hour}`;
        }
        if(minute.toString().length === 1) {
              minute = `0${minute}`;
        }
        if(second.toString().length === 1) {
              second = `0${second}`;
        };
  
        let timer = `${hour}:${minute}:${second}`;
  
        return timer;
  }
  $("#overlay-timer").show();
  function myTimer() {
    var d = new Date() - start_process_time;
    document.getElementById("overlay-timer").innerHTML = 'الوقت: ' + secondsTo_HHMMSS(parseInt(d/1000));
  }
}

function stop_process_timer(){
  $("#overlay-timer").hide();
  clearInterval(current_process_timer_interval);
}