<?php
//require(DOCROOT.'FirePHPCore/fb.php');

class Boskoi_Controller extends Main_Controller {
	
	function __construct()
	{
		parent::__construct();
	}	
	
	
	// #### Hooks ####
	
	public function _report_form() {
		View::factory('report_form_additions')->render(TRUE);
		View::factory('guidelines')->render(TRUE);
	}
	
	public function _main_sidebar() {
		View::factory('download_app')->render(TRUE);
		View::factory('guidelines')->render(FALSE);
		View::factory('howtoreport')->render(TRUE);
	}

	public function _header_scripts() {
		View::factory('header_scripts')->render(TRUE);
	}
	
	public function _map_main() {
		Event::$data = View::factory('map_main')->render().Event::$data;
	}
	
	
	// #### Controller functions ####
	
	public function suggest_category() {
        $form = array (
			'contact_name' => '',
			'contact_email' => '',
			'category_name' => '',			
			'category_info' => ''
		);
		$errors = $form;
		$form_error = false;
		$form_sent = false;
		
		$this->template->header->this_page = "suggest_category";
		$this->template->content = new View('suggest_category');
		
		if ($_POST) {
			$post = Validation::factory($_POST);
			$post->pre_filter('trim', TRUE);
			$post->add_rules('contact_name', 'required', 'length[3,100]');
			$post->add_rules('contact_email', 'required','email', 'length[4,100]');
			$post->add_rules('category_name', 'required', 'length[3,100]');
			$post->add_rules('category_info', 'required');

			if ($post->validate()) {
				$site_email = Kohana::config('settings.site_email');
				$message = "Sender: " . $post->contact_name . "\n";
				$message.= "E-mail address: " . $post->contact_email . "\n";
				$message.= "Category name: " . $post->category_name . "\n\n";
				$message.= "Category info:\n" . $post->category_info . "\n\n\n";
				$message.= "~~~~~~~~~~~~~~~~~~~~~~\n";
				$message.= Kohana::lang('ui_admin.sent_from_website'). url::base();
				email::send( $site_email, $post->contact_email, "Category suggestion: ".$post->category_name, $message, FALSE );
				$form_sent = true;
            } else {
                $form = arr::overwrite($form, $post->as_array());
                $errors = arr::overwrite($errors, $post->errors('boskoi'));
                $form_error = true;
            }
        }
		$this->template->content->form = $form;
		$this->template->content->form_error = $form_error;
		$this->template->content->form_sent = $form_sent;
        $this->template->content->errors = $errors;
        
        // Rebuild Header Block
        $this->template->header->header_block = $this->themes->header_block();	
	}	
	
	public function blog() {
		$this->template->header->this_page = "blog";
		$this->template->content = new View('blog');
		$rss = "";

		$request_url = "http://boskoi.posterous.com/rss.xml"; 
		$ch = curl_init(); 
		$timeout = 5; 
		curl_setopt($ch, CURLOPT_URL, $request_url); 
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1); 
		curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, $timeout); 
		$data = curl_exec($ch); 
		curl_close($ch);
		
		$xml = new SimpleXMLElement($data);

		$perPage = 5;
		$page = isset($_GET['page']) && ($page = intval($_GET['page'])) > 0 ?  $page : 1;
		//$page = 2;
		$start = ($page - 1) * $perPage;
		$end = $start + $perPage;
		
		$i=0;
		
		foreach ($xml->channel->item as $items)
      	{
       		if($i >= $start && $i < $end){
          		$rss = $rss."<h1><a href='".$items->link[0]."'> ".$items->title[0]."</a></h1>".
          		"<div style='width: 45em;'><p>".$items->description[0]. "</p></div><br /><hr /><br /><br /> ";  
          }
		   $i++;
          
      	}
      	
		$pages = ceil($i / $perPage);
		if($page > 1){
			$rss = $rss. '<a href="?page=' . ($page-1) . '"> Previous </a> &nbsp;';
		}
		for ($a=1; $a<=$pages; ++$a) {
			if($page == $a){
				$rss = $rss. '<a href="?page=' . $a . '"><b>' . $a . '</b></a> &nbsp;';
			}else{
				$rss = $rss. '<a href="?page=' . $a . '">' . $a . '</a> &nbsp;';
			}
		}
		if($page < $pages){
			$rss = $rss. '<a href="?page=' . ($page+1) . '"> Next </a> &nbsp;';
		}

		
		//Pass data to view
		$this->template->content->rss = $rss; 
	
		$this->template->header->header_block = $this->themes->header_block();	
	}
}

