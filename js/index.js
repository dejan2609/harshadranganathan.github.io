$( document ).ready(function() {
  $(".CopyIcon").click(function(e){
    var copyText = $(e.target).parent().siblings().find('.cpyCode')
    copyText.select();
    document.execCommand("copy");
  });
  var terminalDivStructure = ($('.terminal').text().trim()).split('.')
  dataLen = terminalDivStructure.length
  for(var i=0; i< dataLen; i++){
    var chara = (terminalDivStructure).trim().charAt(0)
    switch(chara){
      case "$"
    }
  }
  console.log(terminalDivStructure)
});
