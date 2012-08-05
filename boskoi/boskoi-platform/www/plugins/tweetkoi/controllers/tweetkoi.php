<?php
//require(DOCROOT.'FirePHPCore/fb.php');
require(DOCROOT.'plugins/tweetkoi/libraries/twitteroauth.php');

class Tweetkoi_Controller extends Controller {
	
	public function _tweet_report() {
		$report = Event::$data;
		$tweet = $report->incident_title.' @ '.$report->location->location_name.' http://boskoi.org/'.$report->id;
		//fb($tweet,'Tweet text');
		
		$tw = new TwitterOAuth(Kohana::config('tweetkoi.consumer_key'),Kohana::config('tweetkoi.consumer_secret'),Kohana::config('tweetkoi.oauth_token'),Kohana::config('tweetkoi.oauth_token_secret'));
		$result = $tw->post('statuses/update', array('status' => $tweet));	
		print_r($result);
		
		return true;
	}

}

?>