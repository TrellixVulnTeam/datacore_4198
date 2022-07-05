$(document).ready(function() {
  //handle form submition validation
  $('#btn-submit').click(function(e) { 
    var form = document.getElementById('myform')
    if (!form.checkValidity()) {
      e.preventDefault();
      e.stopPropagation();
      form.classList.add('was-validated')
      showError('الرجاء التأكد من تعبئة كل الخانات المطلوبة');
      return false
    }
    return true
  })

  //watch card adding or removal
  $(".cards-container").arrive(".card", function() {
    $(".no-cards-label").addClass('hidden');
  });
  $(".cards-container").leave(".card", function() {
    if($(".cards-container").children().length==0){
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

})

let last_key_down_event_code = 0;

function save_last_key_down(e){
  last_key_down_event_code = e.keyCode
  setTimeout(function() {
    last_key_down_event_code = 0
  }, 200);
}

function validate_en(evt) {
  var ar_to_en_dic = {
    'ض':'q',
    'ص':'w',
    'ث':'e',
    'ق':'r',
    'ف':'t',
    'غ':'y',
    'ع':'u',
    'ه':'i',
    'خ':'o',
    'ح':'p',
    'ش':'a',
    'س':'s',
    'ي':'d',
    'ب':'f',
    'ل':'g',
    'ا':'h',
    'ت':'j',
    'ن':'k',
    'م':'l',
    'ئ':'z',
    'ء':'x',
    'ؤ':'c',
    'ر':'v',
    'لا':'b',
    'ى':'n',
    'ة':'m',
  };
  var theEvent = evt || window.event;
  var key = theEvent.keyCode || theEvent.which;
  key = String.fromCharCode(key);
  if (key ==' '){
    theEvent.returnValue = false;
    if(theEvent.preventDefault) theEvent.preventDefault(); 
    replaceKey($(evt.target),'_')
  }else{
    var regex = /[a-zA-Z0-9_]/;
    if(typeof ar_to_en_dic[key.toLowerCase()] !== 'undefined'){
      if(last_key_down_event_code==66 && ar_to_en_dic[key.toLowerCase()]=='h'){
        last_key_down_event_code = 0
      }else if(last_key_down_event_code==66){
        replaceKey($(evt.target),'b')
      }else{
        replaceKey($(evt.target),ar_to_en_dic[key.toLowerCase()])
      }
      theEvent.returnValue = false;
      if(theEvent.preventDefault) theEvent.preventDefault();
    }else if( !regex.test(key) ) {
      theEvent.returnValue = false;
      if(theEvent.preventDefault) theEvent.preventDefault();
    }else{
      if(key != key.toLowerCase()){
        theEvent.returnValue = false;
        if(theEvent.preventDefault) theEvent.preventDefault(); 
        replaceKey($(evt.target),key.toLowerCase())
      }else{
        theEvent.returnValue = true;
        return true;
      }
    }
  }
}

function replaceKey(input, key){
  var cursorPos = input.prop('selectionStart');
  var v = input.val();
  var textBefore = v.substring(0,  cursorPos);
  var textAfter  = v.substring(input.prop('selectionEnd'), v.length);

  input.val(textBefore + key + textAfter);
  //input.append(key.charAt(0)).focus();
  //input.trigger({type: 'keydown', which: key.charCodeAt(0), keyCode: key.charCodeAt(0)});
}

function validate_ar(evt) {
  var en_to_ar_dic = {
    'q':'ض',
    'w':'ص',
    'e':'ث',
    'r':'ق',
    't':'ف',
    'y':'غ',
    'u':'ع',
    'i':'ه',
    'o':'خ',
    'p':'ح',
    '[':'ج',
    ']':'د',
    'a':'ش',
    's':'س',
    'd':'ي',
    'f':'ب',
    'g':'ل',
    'h':'ا',
    'j':'ت',
    'k':'ن',
    ';':'ك',
    '\'':'ط',
    'l':'م',
    'z':'ئ',
    'x':'ء',
    'c':'ؤ',
    'v':'ر',
    'b':'لا',
    'n':'ى',
    'm':'ة',
    ',':'و',
    '.':'ز',
    '/':'ظ',
    '`':'ذ'
  };
  var theEvent = evt || window.event;
  var key = theEvent.keyCode || theEvent.which;
  key = String.fromCharCode(key);
  if (key ==' '){
    replaceKey($(evt.target),'_')
    theEvent.returnValue = false;
    if(theEvent.preventDefault) theEvent.preventDefault(); 
  }else if(typeof en_to_ar_dic[key.toLowerCase()] !== 'undefined'){
    theEvent.returnValue = false;
    if(theEvent.preventDefault) theEvent.preventDefault(); 
    replaceKey($(evt.target),en_to_ar_dic[key.toLowerCase()])
  }else{
    var regex = /[\u0621-\u064A0-9_]/;
    if( !regex.test(key) ) {
      theEvent.returnValue = false;
      if(theEvent.preventDefault) theEvent.preventDefault();
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
  return function(json) {
    hideOverlay();

    if(json['code'] == '0'){
        if (typeof action !== 'undefined' && typeof url !== 'undefined'){
          if(action=='add' || 'edit'){
              setTimeout(function() {
                  document.location.href = url;
              }, 1500);
          }else{
              $('#btn-submit').prop('disabled', false);
          }
        }
        if (typeof success_function !== 'undefined'){
          success_function()
        }
        showSuccess(json['message']);
    }else{
        $('#btn-submit').prop('disabled', false);
        showError(json['message']);
    }
  }
}

function showSuccess(message){
  document.getElementsByClassName('toast-header')[0].style = 'background-color: deepskyblue'
  document.getElementsByClassName('me-auto')[0].innerHTML = 'نجاح';
  document.getElementsByClassName('toast-body')[0].innerHTML = message
  const toast = new bootstrap.Toast(document.getElementById('liveToast'));
  toast.show()
}

function showError(message){
  document.getElementsByClassName('toast-header')[0].style = 'background-color: lightcoral'
  document.getElementsByClassName('me-auto')[0].innerHTML = 'خطأ';
  document.getElementsByClassName('toast-body')[0].innerHTML = message
  const toast = new bootstrap.Toast(document.getElementById('liveToast'));
  toast.show()
}

function get_ajax_error_function() {
  // handle a non-successful response
  return function(xhr,errmsg,err) {
      hideOverlay();
      showError(err);
      console.log(xhr.status + ": " + xhr.responseText); 
      $('#btn-submit').prop('disabled', false);
  }
}

function update_button_delete_data(e){
  var button = $(e.delegateTarget)
  var entityid = button.attr('data-entityid')
  $('#button-confirm-delete').attr('data-entityid',entityid)
}

function delete_confirmed(url, csrf_token, e){
  var button = $(e.target)
  var entityid = button.attr('data-entityid')
  delete_entity(url,csrf_token,entityid)
}

function update_button_reset_password(e){
  var button = $(e.delegateTarget)
  var entityid = button.attr('data-entityid')
  $('#button-confirm-reset').attr('data-entityid',entityid)
}

function reset_confirmed(csrf_token, e){
  var button = $(e.target)
  var entityid = button.attr('data-entityid')
  change_password(csrf_token,entityid)
}

// AJAX for posting
function delete_entity(url, csrf_token, entityid) {
  showOverlay();
  $.ajax({
      url : url, // the endpoint
      type : "POST", // http method
      data : { 
          csrfmiddlewaretoken: csrf_token,
          action: 'delete',
          entityid : entityid
      }, // data sent with the post request

      success : get_ajax_success_function(undefined,undefined,function(){
        document.getElementById('card-' + entityid).remove();
        document.getElementById('navitem-' + url.split('/')[1] + '-' + entityid).remove();
        if(url == '/databases/' && $(".cards-container").children().length==0){
            setTimeout(function() {
              document.location.href = url;
            }, 1000);
        }
      }),

      error : get_ajax_error_function()
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
      url : '/', // the endpoint
      type : "POST", // http method
      data : { 
          csrfmiddlewaretoken: csrf_token,
          action: 'change_password',
          userid: userid,
          new_password : ((userid == null) ? $('#id_new_password').val() : '123456789'),
          confirm_password: ((userid == null) ? $('#id_confirm_password').val() : '123456789')
      }, // data sent with the post request

      success : function(json) {
        hideOverlay();
        if(json['code'] == '0'){
            $('#changePassModal').modal('hide')
            showSuccess(json['message']);
        }else{
            $('#change_pass_error_label')[0].innerText = json['message'];
            showError(json['message']);
        }
      },
      error :  function(xhr,errmsg,err) {
        hideOverlay();
        showError(err);
        console.log(xhr.status + ": " + xhr.responseText); 
      }
  });
};

function createTable(tableData) {
  var table = document.createElement('table');
  table.classList="table table-striped"
  var tableHead = document.createElement('thead');
  tableHead.style="background-color: #dfdfdf !important;";
  var tableBody = document.createElement('tbody');

  tableData.forEach(function(rowData, index) {
    var row = document.createElement('tr');

    var c_ = document.createElement('th');
    c_.appendChild(document.createTextNode(index==0 ? '#' : index));
    row.appendChild(c_);

    rowData.forEach(function(cellData) {
      var cell = document.createElement(index==0 ? 'th' : 'td');
      cell.classList = "ellipsis"
      cell.style = "max-width:100px"
      if(index>1 && index==tableData.length-1)
        cellData = '...';
      cell.appendChild(document.createTextNode(cellData));
      row.appendChild(cell);
    });

    if(index==0)
      tableHead.appendChild(row)
    else
      tableBody.appendChild(row);
  });

  table.appendChild(tableHead);
  table.appendChild(tableBody);
  return table;
}