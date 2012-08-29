<?php defined('SYSPATH') or die('No direct script access.');
/**
 * MHI Controller
 *
 * PHP version 5
 * LICENSE: This source file is subject to LGPL license
 * that is available through the world-wide-web at the following URI:
 * http://www.gnu.org/copyleft/lesser.html
 * @author     Ushahidi Team <team@ushahidi.com>
 * @package    Ushahidi - http://source.ushahididev.com
 * @module     MHI Controller
 * @copyright  Ushahidi - http://www.ushahidi.com
 * @license    http://www.gnu.org/copyleft/lesser.html GNU Lesser General Public License (LGPL)
 */

class MHI_Controller extends Template_Controller {

	// MHI template

	public $template = 'layout';

	function __construct()
	{
		parent::__construct();

		$session = Session::instance();

		// Load Header & Footer

		$this->template->header  = new View('mhi/mhi_header');
		$this->template->footer  = new View('mhi/mhi_footer');

		$this->template->footer->ushahidi_stats = Stats_Model::get_javascript();

		$this->template->header->site_name = Kohana::config('settings.site_name');

		// Initialize JS variables. js_files is an array of ex: html::script('media/js/jquery.validate.min');
		// Add the sign in box javascript

		$this->template->header->js = new View('mhi/mhi_js_signin');
		$this->template->header->js_files = array();

		// Google Analytics

		$google_analytics = Kohana::config('settings.google_analytics');
		$this->template->footer->google_analytics = $this->_google_analytics($google_analytics);

		// If we aren't at the top level MHI site or MHI isn't enabled, don't allow access to any of this jazz
		/*
		if (Kohana::config('config.enable_mhi') == FALSE OR Kohana::config('settings.subdomain') != '')
			throw new Kohana_User_Exception('MHI Access Error', "MHI disabled for this site.");
		*/
		// Login Form variables

		$this->template->header->errors = '';
		$this->template->header->form = array('username'=>'');
		$this->template->header->form_error = '';
		$this->template->header->mhi_user_id = $session->get('mhi_user_id');

	}

	public function index()
	{
		$session = Session::instance();

		$this->template->header->this_body = 'crowdmap-home';

		$this->template->content = new View('mhi/mhi');

		$this->template->header->js .= new View('mhi/mhi_js');
		$this->template->header->js_files = array(html::script('media/js/mhi/jquery.cycle.min'));

		$mhi_user_id = $session->get('mhi_user_id');

		$form = array(
			'username' => '',
			'password' => '',
			);

		// Copy the form as errors, so the errors will be stored with keys corresponding to the form field names

		$errors = $form;
		$form_error = FALSE;

		// Set up the validation object

		$_POST = Validation::factory($_POST)
			->pre_filter('trim')
			->add_rules('username', 'required')
			->add_rules('password', 'required');

		// OR $mhi_user_id != FALSE
		if ($_POST->validate())
		{
			// Sanitize $_POST data removing all inputs without rules

			$postdata_array = $_POST->safe_array();

			// MHI user not already logged in, so do it

			if ($mhi_user_id == FALSE)
			{
				$mhi_user = new Mhi_User_Model;
				$mhi_user_id = $mhi_user->login($postdata_array['username'],$postdata_array['password']);
			}

			// If success (already logged in or login successful), move on

			if ($mhi_user_id != FALSE)
			{

				Mhi_Log_Model::log($mhi_user_id,1);

				url::redirect('mhi/manage');

			}else{

				$_POST->add_error('username', 'Login Error');

				// Repopulate the form fields

				$form = arr::overwrite($form, $_POST->as_array());

				// Populate the error fields, if any
				// We need to already have created an error message file, for Kohana to use
				// Pass the error message file name to the errors() method

				$errors = arr::overwrite($errors, $_POST->errors('auth'));
				$form_error = TRUE;

			}
		}

		$this->template->header->errors = $errors;
		$this->template->header->form = $form;
		$this->template->header->form_error = $form_error;
	}

	public function manage()
	{
		// If not logged in, go back to the start

		$session = Session::instance();
		$mhi_user_id = $session->get('mhi_user_id');

		if ($mhi_user_id == FALSE)
		{
			// If the user is not logged in, go home.

			url::redirect('/');
		}

		// Activate or deactivate a site

		if(isset($_GET['deactivate']) OR isset($_GET['activate']))
		{
			$this->activation();
		}

		$this->template->header->this_body = '';
		$this->template->content = new View('mhi/mhi_manage');
		$this->template->content->sites_pw_changed = array();

		// Manage JS

		$this->template->header->js .= new View('mhi/mhi_manage_js');

		$this->template->content->domain_name = $_SERVER['HTTP_HOST'].Kohana::config('config.site_domain');

		$mhi_site = new Mhi_Site_Model;
		$all_user_sites = $mhi_site->get_user_sites($mhi_user_id,TRUE);
		$this->template->content->sites = $all_user_sites;

		if ($_POST)
		{
			$new_password = $_POST['admin_password'];

			if ($_POST['change_pw_for'] == 'all')
			{
				// Get all domains
				$site_domains = array();
				foreach($all_user_sites as $site) {
					$site_domains[] = $site->site_domain;
				}
			}else{
				// If we are only changing one domain
				$site_domains = array($_POST['site_domain']);
			}

			$db_genesis = new DBGenesis;
			$mhi_site = new Mhi_Site_Model;

			// Check if the logged in user is the owner of the site

			$domain_owners = $mhi_site->domain_owner($site_domains);

			// using array_unique to see if there is only one owner

			$domain_owners = array_unique($domain_owners);

			if(count($domain_owners) != 1)
			{
				// If there are more than one owner, the we shouldn't be able to change all those passwords.
				throw new Kohana_User_Exception('Site Ownership Error', "Improper owner for site to change password.");
			}

			$domain_owner = current($domain_owners);

			// If the owner of the site isn't the person updating the password for the site, there's something fishy going on

			if($domain_owner == $mhi_user_id)
			{
				$db_genesis->change_admin_password($site_domains,$new_password);
				$this->template->content->sites_pw_changed = $site_domains;
			}
		}
	}

	public function activation()
	{

		if( ! isset($_GET['deactivate']) AND ! isset($_GET['activate'])) return false;

		$session = Session::instance();
		$mhi_user_id = $session->get('mhi_user_id');

		if(isset($_GET['deactivate']))
		{
			$site_domain = $_GET['deactivate'];
			$activation = 0;
		}else{
			$site_domain = $_GET['activate'];
			$activation = 1;
		}

		$mhi_site = new Mhi_Site_Model;

		// Check if the logged in user is the owner of the site

		$domain_owners = $mhi_site->domain_owner(array($site_domain));

		// using array_unique to see if there is only one owner

		$domain_owners = array_unique($domain_owners);

		if(count($domain_owners) != 1)
		{
			// If there are more than one owner, the we shouldn't be able to change all those passwords.
			throw new Kohana_User_Exception('Site Ownership Error', "Improper owner for site to change password.");
		}

		$domain_owner = current($domain_owners);

		// If the owner of the site isn't the person updating the password for the site, there's something fishy going on

		if($domain_owner == $mhi_user_id)
		{
			$mhi_site->activation($site_domain,$activation);
		}
	}

	public function about($page='about')
	{
		if ($page == 'faq')
		{
			$this->template->header->this_body = 'crowdmap-faq';
			$this->template->content = new View('mhi/mhi_faq');
		}else{
			$this->template->header->this_body = 'crowdmap-about';
			$this->template->content = new View('mhi/mhi_about');
		}
	}

	public function legal($page='tos')
	{
		$this->template->header->this_body = 'crowdmap-legal';
		if ($page == 'dmca')
		{
			$this->template->content = new View('mhi/mhi_legal_dmca');
		}elseif ($page == 'privacy') {
			$this->template->content = new View('mhi/mhi_legal_privacy');
		}else{
			// Terms of Service
			$this->template->content = new View('mhi/mhi_legal');
		}
	}

	public function contact()
	{
		$this->template->header->this_body = 'crowdmap-contact';
		$this->template->content = new View('mhi/mhi_contact');

        $form = array(
            'contact_email' => '',
            'contact_subject' => '',
            'contact_message' => '',
            'contact_captcha' => '',
        );

		$errors = $form;

        $success_message = '';
        $form_error = FALSE;
        $captcha = Captcha::factory();

		if ($_POST)
		{
			$post = Validation::factory($_POST)
				->pre_filter('trim')
				->add_rules('contact_email', 'required', array('valid','email'))
				->add_rules('contact_subject', 'required')
				->add_rules('contact_message', 'required')
                ->add_rules('contact_captcha', 'required','Captcha::valid');

			if ($post->validate())
			{

				email::send(Kohana::config('settings.site_email'),$post->contact_email,$post->contact_subject,$post->contact_message,FALSE);

				$success_message = 'Email sent. We will get back to you as quickly as we can. Thank you!';

			}
            else
            {

                $form = arr::overwrite($form, $post->as_array());

                $errors = arr::overwrite( $errors,
                        $post->errors('mhi'));
                $form_error = TRUE;

			}

		}

        $this->template->content->form = $form;
        $this->template->content->form_error = $form_error;
		$this->template->content->errors = $errors;
		$this->template->content->success_message = $success_message;
        $this->template->content->captcha = $captcha;
	}

	// Displays true if the email is free to be registered
	public function checkemail()
	{
		$this->template->header = FALSE;
		$this->template->footer = FALSE;
		$this->template->content = FALSE;
		$id = Mhi_User_Model::get_id($_POST['signup_email']);
		if($id == NULL OR $id == FALSE OR $id == '')
		{
			echo 'true';
		}else{
			echo 'false';
		}
	}

	// Displays true if the email is free to be registered
	public function checksubdomain()
	{
		$this->template->header = FALSE;
		$this->template->footer = FALSE;
		$this->template->content = FALSE;
		$exists = Mhi_Site_Model::domain_exists($_POST['signup_subdomain']);
		if($exists == FALSE)
		{
			echo 'true';
		}else{
			echo 'false';
		}
	}

	public function features()
	{
		$this->template->header->this_body = 'crowdmap-features';
		$this->template->content = new View('mhi/mhi_features');
	}

	public function account()
	{

		// If not logged in, go back to the start

		$session = Session::instance();
		$mhi_user_id = $session->get('mhi_user_id');
		if ($mhi_user_id == FALSE)
		{
			// If the user is not logged in, go home.
			url::redirect('/');
		}

		$this->template->header->this_body = '';
		$this->template->content = new View('mhi/mhi_account');
		$this->template->header->js .= new View('mhi/mhi_account_js');

		// Initiate the variable that holds the message displayed on form success

		$this->template->content->success_message = '';

		$mhi_user = new Mhi_User_Model;

		// Get user info

		$this->template->content->user = $mhi_user->get($mhi_user_id);

		$form_error = FALSE;
		$errors = FALSE;

		// Set up the validation object

		$_POST = Validation::factory($_POST)
			->pre_filter('trim')
			->add_rules('firstname', 'required')
			->add_rules('lastname', 'required')
			->add_rules('email', 'required')
			->add_rules('account_password', 'required');

		if ($_POST->validate())
		{
			$mhi_user = new Mhi_User_Model;

			$postdata_array = $_POST->safe_array();

			$update = $mhi_user->update($mhi_user_id,array(
				'firstname'=>$postdata_array['firstname'],
				'lastname'=>$postdata_array['lastname'],
				'email'=>$postdata_array['email'],
				'password'=>$postdata_array['account_password']
			));

			// If update worked, present a success message to the user

			if ($update != FALSE)
			{
				$this->template->content->success_message = 'Success! You have updated your account.';

				// Reload user information since it has changed

				$this->template->content->user = $mhi_user->get($mhi_user_id);

				Mhi_Log_Model::log($mhi_user_id,7,'Updated to: '.$postdata_array['firstname'].' '.$postdata_array['lastname'].' '.$postdata_array['email'].' (hidden password)');

			}else{
				$errors = array('Something went wrong with form submission. Please try again.');
				$form_error = TRUE;
			}
		}

		$this->template->content->form_error = $form_error;
		$this->template->content->errors = $errors;

	}

	public function logout()
	{
		$session = Session::instance();
		$mhi_user_id = $session->get('mhi_user_id');
		Mhi_Log_Model::log($mhi_user_id,2);

		$mhi_user = new Mhi_User_Model;
		$mhi_user->logout();

		url::redirect('/');
	}

	public function reset_password()
	{
		$this->template->header->this_body = '';
		$this->template->content = new View('mhi/mhi_reset_password');
		$this->template->content->reset_flag = FALSE;
		$this->template->content->email_exists = TRUE;

		if ($_POST)
		{
			// Validate the email address
			$post = Validation::factory($_POST);
			$post->pre_filter('trim');
			$post->add_rules('email', 'required','email');

			if ($post->validate()){

				$settings = kohana::config('settings');

				$mhi_user = new Mhi_User_Model;

				$email = $post->email;

				$mhi_user_id = $mhi_user->get_id($email);

				if($mhi_user_id == NULL)
				{
					// User doesn't exist
					$this->template->content->email_exists = FALSE;
					return;

				}

				$new_password = text::rand_str(15);

				$update = $mhi_user->update($mhi_user_id,array(
						'password'=>$new_password
					));

				$to = $email;
				$from = $settings['site_email'];
				$subject = 'Your Crowdmap password has been reset.';
				$message = 'You have chosen to have your password reset. We have gone ahead and changed your login information to the following:'."\n\n";
				$message .= 'E-mail: '.$email."\n";
				$message .= 'Password: '.$new_password."\n\n";
				$message .= 'Now that your password has changed, please visit the website at http://crowdmap.com to change it to something you prefer.'."\n\n";
				$message .= 'Thank you!'."\n";
				$message .= 'The Crowdmap Team';

				email::send($to,$from,$subject,$message,FALSE);

				Mhi_Log_Model::log($mhi_user_id,5);

				$this->template->content->reset_flag = TRUE;
			}else{
				throw new Kohana_User_Exception('E-mail Validation Error', "Email didn't validate");
			}
		}
	}

	public function signup()
	{
		$this->template->header->this_body = '';
		$this->template->content = new View('mhi/mhi_signup');
		$this->template->header->js .= new View('mhi/mhi_signup_js');
		$this->template->header->js_files = array(html::script('media/js/mhi/initialize', true));

		$this->template->content->site_name = Kohana::config('settings.site_name');
		$this->template->content->domain_name = $_SERVER['HTTP_HOST'].Kohana::config('config.site_domain');

		$session = Session::instance();
		$this->template->content->logged_in = $session->get('mhi_user_id');

		$form_array = array(
			'errors' => array(),
			'form' => array(
				'signup_first_name' => '',
				'signup_last_name' => '',
				'signup_email' => '',
				'signup_password' => '',
				'signup_subdomain' => '',
				'signup_instance_name' => '',
				'signup_instance_tagline' => ''
			),
			'form_error' => array()
		);

		if ($_POST)
		{
			$form_array = $this->processcreation();

			// If there were no errors, redirect to management page

			if(count($form_array['form_error']) == 0)
			{
				url::redirect('mhi/manage');
			}

		}

		$this->template->content->errors = $form_array['errors'];
		$this->template->content->form = $form_array['form'];
		$this->template->content->form_error = $form_array['form_error'];
	}

	public function processcreation()
	{
		// Used to populate form fields. Will assign values on error

		$errors = array();
		$form = array(
			'signup_first_name' => '',
			'signup_last_name' => '',
			'signup_email' => '',
			'signup_password' => '',
			'signup_subdomain' => '',
			'signup_instance_name' => '',
			'signup_instance_tagline' => ''
		);
		$form_error = array();

		// Process Form

		if ($_POST)
		{

			$sfn = isset($_POST['signup_first_name']) ? $_POST['signup_first_name'] : '';
			$sln = isset($_POST['signup_last_name']) ? $_POST['signup_last_name'] : '';
			$sem = isset($_POST['signup_email']) ? $_POST['signup_email'] : '';
			$spw = isset($_POST['signup_password']) ? $_POST['signup_password'] : '';

			$form = array(
				'signup_first_name' => $sfn,
				'signup_last_name' => $sln,
				'signup_email' => $sem,
				'signup_password' => $spw,
				'signup_subdomain' => strtolower($_POST['signup_subdomain']),
				'signup_instance_name' => $_POST['signup_instance_name'],
				'signup_instance_tagline' => $_POST['signup_instance_tagline']
			);


			$post = Validation::factory($_POST);

			// Trim whitespaces

			$post->pre_filter('trim');

			$session = Session::instance();
			$mhi_user_id = $session->get('mhi_user_id');

			$blocked_subdomains = Kohana::config('mhi.blocked_subdomains');

			// These rules are only required if we aren't already logged in

			if ($mhi_user_id == FALSE)
			{
				$post->add_rules('signup_first_name','required');
				$post->add_rules('signup_last_name','required');
				$post->add_rules('signup_email', 'required','email');
				$post->add_rules('signup_password','required');
			}else{
				$post->add_rules('verify_password','required');
			}

			$post->add_rules('signup_subdomain','required','alpha_dash');
			$post->add_rules('signup_instance_name','required');
			$post->add_rules('signup_instance_tagline','required');

			// If we pass validation AND it's not one of the blocked subdomains
			if ($post->validate())
			{

				$mhi_user = new Mhi_User_Model;
				$db_genesis = new DBGenesis;
				$mhi_site_database = new Mhi_Site_Database_Model;
				$mhi_site = new Mhi_Site_Model;

				// Setup DB name variable

				$base_db = $db_genesis->current_db();

				$new_db_name = $base_db.'_'.strtolower($post->signup_subdomain);

				// Do some graceful validation

				if ( ! isset($post->signup_tos))
				{
					return array(
						'errors' => $errors,
						'form' => $form,
						'form_error' => array('signup_tos' => 'You must accept the Website Terms of Use.')
					);
				}

				if (strlen($post->signup_subdomain) < 4 OR strlen($post->signup_subdomain) > 32)
				{
					// ERROR: subdomain length falls outside the char length bounds allowed.

					return array(
						'errors' => $errors,
						'form' => $form,
						'form_error' => array('signup_subdomain' => 'Subdomain must be between at least 4 characters and no more than 32 characters long. Please try again.')
					);
				}

				if ($mhi_site->domain_exists($post->signup_subdomain))
				{
					// ERROR: Domain already assigned in MHI DB.

					return array(
						'errors' => $errors,
						'form' => $form,
						'form_error' => array('signup_subdomain' => 'This subdomain has already been taken. Please try again.')
					);
				}

				if ($mhi_site_database->db_assigned($new_db_name) OR $db_genesis->db_exists($new_db_name))
				{
					// ERROR: Database already exists and/or is already assigned in the MHI DB

					return array(
						'errors' => $errors,
						'form' => $form,
						'form_error' => array('signup_subdomain' => 'This subdomain is not allowed. Please try again.')
					);
				}

				if(in_array(strtolower($post->signup_subdomain),$blocked_subdomains))
				{
					// ERROR: Blocked Subdomain

					return array(
						'errors' => $errors,
						'form' => $form,
						'form_error' => array('signup_subdomain' => 'This subdomain is not allowed. Please try again.')
					);
				}

				// Check passwords if logged in and create user if not

				if ($mhi_user_id != FALSE)
				{

					// Get user info

					$user = $mhi_user->get($mhi_user_id);

					$salt = Kohana::config('auth.salt_pattern');
					$verify_password = sha1($post->verify_password.$salt);

					if ($verify_password != $user->password)
					{
						// ERROR: Passwords do not match.

						return array(
							'errors' => $errors,
							'form' => $form,
							'form_error' => array('password' => 'Password doesn\'t match. Please try again.')
						);
					}

					$user_id = $mhi_user_id;
					$email = $user->email;
					$name = $user->firstname.' '.$user->lastname;
					$password = $post->verify_password;

				}else{

					// Save new user

					$user_id = $mhi_user->save_user(array(
						'firstname'=>$post->signup_first_name,
						'lastname'=>$post->signup_last_name,
						'email'=>$post->signup_email,
						'password'=>$post->signup_password
					));

					$email = $post->signup_email;
					$name = $post->signup_first_name.' '.$post->signup_last_name;
					$password = $post->signup_password;

					// Log new user in
					$mhi_user_id = $mhi_user->login($email,$password);

					Mhi_Log_Model::log($mhi_user_id,6);

				}

				// Set up DB and Site

				// Create site

				$site_id = $mhi_site->save_site(array(
					'user_id'=>$user_id,
					'site_domain'=>strtolower($post->signup_subdomain),
					'site_privacy'=>1,	// TODO: 1 is the hardcoded default for now. Needs to be changed?
					'site_active'=>1	// TODO: 1 is the default. This needs to be a config item since this essentially "auto-approves" sites
				));

				// Set up database and save details to MHI DB

				$db_genesis->create_db($new_db_name);
				$mhi_site_database->assign_db($new_db_name,$site_id);
				$db_genesis->populate_db($new_db_name,
					array(
						'username'=>$email,
						'name'=>$name,
						'password'=>$password,
						'email'=>$email),
					array(
						'site_name'=>$post->signup_instance_name,
						'site_tagline'=>$post->signup_instance_tagline,
						'site_domain'=>strtolower($post->signup_subdomain)));

				// Congrats, everything has been set up. Send an email confirmation.

				$settings = kohana::config('settings');
				$new_site_url = 'http://'.strtolower($post->signup_subdomain).'.'.$_SERVER['HTTP_HOST'].Kohana::config('config.site_domain');

				if ($settings['site_email'] != NULL)
				{
					$to = $email;
					$from = $settings['site_email'];
					$subject = 'Your deployment at '.$settings['site_name'];
					$message = 'Your new site, '.$post->signup_instance_name.' has been set up.'."\n";
					$message .= 'Admin URL: '.$new_site_url.'admin'."\n";
					$message .= 'Username: '.$email."\n";
					$message .= 'Password: (hidden)'."\n";

					email::send($to,$from,$subject,$message,FALSE);
				}

				Mhi_Log_Model::log($user_id,3,'Deployment Created: '.strtolower($post->signup_subdomain));

			}else{
				if (isset($_POST['signup_password'])) unset($_POST['signup_password']);
				if (isset($_POST['signup_confirm_password'])) unset($_POST['signup_confirm_password']);
				if (isset($_POST['verify_password'])) unset($_POST['verify_password']);
				Mhi_Log_Model::log($mhi_user_id,8,'Variables: '.print_r($_POST,true).' * '.print_r($post->errors('form_error_messages'),true));
				throw new Kohana_User_Exception('Validation Error', "Form not validating. Please go back and try again.");
			}

		}else{

			// If the form was never posted, we need to complain about it.

			throw new Kohana_User_Exception('Incomplete Form', "Form not posted.");
		}

		return array(
			'errors' => $errors,
			'form' => $form,
			'form_error' => $form_error
		);
	}

	/*
	* Google Analytics
	* @param text mixed  Input google analytics web property ID.
    * @return mixed  Return google analytics HTML code.
	*/
	private function _google_analytics($google_analytics = false)
	{
		$html = "";
		if (!empty($google_analytics)) {
				$html = '<script type="text/javascript">

				  var _gaq = _gaq || [];
				  _gaq.push([\'_setAccount\', \''.$google_analytics.'\']);
				  _gaq.push([\'_trackPageview\']);

				  (function() {
				    var ga = document.createElement(\'script\'); ga.type = \'text/javascript\'; ga.async = true;
				    ga.src = (\'https:\' == document.location.protocol ? \'https://ssl\' : \'http://www\') + \'.google-analytics.com/ga.js\';
				    var s = document.getElementsByTagName(\'script\')[0]; s.parentNode.insertBefore(ga, s);
				  })();

				</script>';
		}
		return $html;
	}

}
