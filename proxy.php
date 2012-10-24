<?php

if(isset($_POST['action']) && !empty($_POST['action'])) {
    $action = $_POST['action'];
    switch($action) {
        case 'ref' : 
        header('Content-Type: application/json');
        echo json_encode( ref());
        break;
    }
}

function ref()
{
	$json = file_get_contents($_POST['url']);
	return $json;
}
?>