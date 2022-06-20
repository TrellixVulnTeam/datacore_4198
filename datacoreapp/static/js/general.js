$(document).ready(function() {
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
})

function validate_en(evt) {
  var theEvent = evt || window.event;

  // Handle paste
  if (theEvent.type === 'paste') {
      key = event.clipboardData.getData('text/plain');
  } else {
  // Handle key press
      var key = theEvent.keyCode || theEvent.which;
      key = String.fromCharCode(key);
  }
  var regex = /[a-zA-Z0-9_]|\./;
  if( !regex.test(key) ) {
    theEvent.returnValue = false;
    if(theEvent.preventDefault) theEvent.preventDefault();
  }
}

function validate_ar(evt) {
  var theEvent = evt || window.event;

  // Handle paste
  if (theEvent.type === 'paste') {
      key = event.clipboardData.getData('text/plain');
  } else {
  // Handle key press
      var key = theEvent.keyCode || theEvent.which;
      key = String.fromCharCode(key);
  }
  var regex = /[\u0621-\u064A0-9_]|\./;
  if( !regex.test(key) ) {
    theEvent.returnValue = false;
    if(theEvent.preventDefault) theEvent.preventDefault();
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
      document.getElementsByClassName('toast-body')[0].innerHTML = err;
      const toast = new bootstrap.Toast(document.getElementById('liveToast'));
      toast.show()
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
        document.getElementById('navitem-' + entityid).remove();
      }),

      error : get_ajax_error_function()
  });
};