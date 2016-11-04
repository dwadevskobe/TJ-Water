Uses the data from get_data

<script type="text/javascript">
    function reqListener () {
      console.log(this.responseText);
    }

    var oReq = new XMLHttpRequest(); //New request object
    oReq.onload = function() {
        //This is where you handle what to do with the response.
        //The actual data is found on this.responseText
        var foo = JSON.parse(oReq.responseText);
        for ( var $i = 0; $i < foo.length; $i++){
        	document.write(foo[$i] + "<br>");
        }
    };
    oReq.open("GET", "get_data.php", true);
    //                               ^ Don't block the rest of the execution.
    //                                 Don't wait until the request finishes to 
    //                                 continue.

    oReq.send();


</script>



