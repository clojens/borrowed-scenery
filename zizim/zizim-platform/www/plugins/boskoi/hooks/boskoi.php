<?php

Event::add('ushahidi_action.report_form', array('Boskoi_Controller', '_report_form'));
Event::add('ushahidi_action.main_sidebar', array('Boskoi_Controller', '_main_sidebar'));
Event::add('ushahidi_action.header_scripts', array('Boskoi_Controller', '_header_scripts'));

//Event::add('ushahidi_action.main_footer', 'test_hook');
//Event::add('ushahidi_action.map_main_filters', 'test_hook');
//Event::add('ushahidi_action.nav_main_bottom', 'test_hook');
//Event::add('ushahidi_action.report_meta', 'test_hook');

//Event::add('ushahidi_filter.map_timeline', 'test_time');
Event::add('ushahidi_filter.map_main', array('Boskoi_Controller', '_map_main'));
//Event::add('ushahidi_filter.report_description', 'test_filter');
//Event::add('ushahidi_filter.report_stats', 'test_filter');

function test_hook() {
	$trace=debug_backtrace();
	echo $trace[2]['args'][0];
}

function test_filter() {
	$trace=debug_backtrace();
	$event = $trace[2]['args'][0];
	Event::$data = $event.Event::$data;
}

function test_time() {
	echo '<!-- debug ';
	print_r(Event::$data);
	echo '-->';
}

?>