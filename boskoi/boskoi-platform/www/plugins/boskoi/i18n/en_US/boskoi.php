<?php

$lang = array
(
	'contact_name' => array
	(
		'required'		=> 'The name field is required.',
		'length'        => 'The name field must be at least 3 characters long.'
	),

	'category_name' => array
	(
		'required'		=> 'The category name is required.',
		'length'        => 'The category name must be at least 3 characters long.'
	),
	
	'category_info' => array
	(
		'required'        => 'Please provide some additional information about your suggested category.'
	),
	
	'contact_email' => array
	(
		'required'    => 'The e-mail field is required.',
		'email'		  => 'The e-mail field does not appear to contain a valid email address?',
		'length'	  => 'The e-mail field must be at least 4 and no more 64 characters long.'
	)
		
);

?>