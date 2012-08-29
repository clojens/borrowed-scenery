<?php
/**
 * MHI - Signup
 *
 * PHP version 5
 * LICENSE: This source file is subject to LGPL license
 * that is available through the world-wide-web at the following URI:
 * http://www.gnu.org/copyleft/lesser.html
 * @author     Ushahidi Team <team@ushahidi.com>
 * @package    Ushahidi - http://source.ushahididev.com
 * @module     Page View
 * @copyright  Ushahidi - http://www.ushahidi.com
 * @license    http://www.gnu.org/copyleft/lesser.html GNU Lesser General Public License (LGPL)
 */
?>
        <div id="primary-content">
            <div class="twocol-left"><div class="content-shadow">
            	
            	<?php if($logged_in == FALSE){ ?>
            	
            		<h2>Sign up for your free Crowdmap account</h2>
                	<p>Fill out the form below to set up your own deployment of Crowdmap.</p>
                	
                	<?php print form::open(url::site().'mhi/signup', array('id' => 'frm-MHI-Signup', 'name' => 'frm-MHI-Signup', 'class' => 'frm-content')); ?>
                
                    <img src="<?php echo url::site(); ?>media/img/mhi/step-1.gif" align="left" class="step" /> <h2 class="step-1">Create Your Account</h2>
                   
                    <table><tbody>
			            <tr>
			              <td><label for="signup_first_name">First name</label></td>
			              <td><input type="text" size="24" name="signup_first_name" maxlength="42" id="signup_first_name" value="<?php echo $form['signup_first_name']; ?>"/></td>
			            </tr>
			            <tr>
			              <td><label for="signup_last_name">Last name</label></td>
			              <td><input type="text" size="24" name="signup_last_name" maxlength="42" id="signup_last_name" value="<?php echo $form['signup_last_name']; ?>"/></td>
			            </tr>
			            <tr>
			              <td><label for="signup_email">Email</label></td>
			              <td><input type="text" size="24" name="signup_email" maxlength="42" id="signup_email" value="<?php echo $form['signup_email']; ?>"/>
			              <span>This will also be your username.</span></td>
			            </tr>
			            <tr>
			              <td><label for="signup_password">Password</label></td>
			              <td><input type="password" size="24" name="signup_password" maxlength="42" id="signup_password" value="<?php echo $form['signup_password']; ?>"/>
			              <span>Use 4 to 32 characters.</span></td>
			            </tr>
			            <tr>
			              <td><label for="signup_confirm_password">Confirm Password</label></td>
			              <td><input type="password" size="24" name="signup_confirm_password" maxlength="42" id="signup_confirm_password"/></td>
			            </tr>
			            
			            <?php if(isset($form_error['password'])) { ?>
			            <tr>
			            	<td></td>
			            	<td><p style="color:red">* <?php echo $form_error['password']; ?></p></td>
			            </tr>
	                    <?php } ?>
			        
			        </tbody></table>
			        
			        <?php }else{ ?>
			        
			        <h2>Create a new deployment</h2>
                	<p>Fill out the form below to set up a new deployment on your account.</p>
                	
                	<?php print form::open(url::site().'mhi/signup', array('id' => 'frm-MHI-Signup', 'name' => 'frm-MHI-Signup', 'class' => 'frm-content')); ?>
			        
			        <img src="<?php echo url::site(); ?>media/img/mhi/step-1.gif" align="left" class="step" /> <h2 class="step-1">Verify Your Account</h2>
					
					<p>
			        	<label for="verify_password">Account Password</label><br/>
			        	<input type="password" size="24" name="verify_password" maxlength="42" id="verify_password" />	
			        </p>
			        
			        <?php if(isset($form_error['password'])) { ?>
       				<p style="color:red">* <?php echo $form_error['password']; ?></p>
                    <?php } ?>
			        
			        <?php } ?>
                    
                    <hr />
                    
                    <img src="<?php echo url::site(); ?>media/img/mhi/step-2.gif" align="left"  class="step"/> <h2 class="step-2">Create Your Deployment Address</h2>
                    <p class="desc">Each deployment has it's own web address. <strong>No spaces, use letters and numbers only.</strong></p>
       				<p class="url">http://<input type="text" size="20" onfocus="this.style.color = 'black'" name="signup_subdomain" maxwidth="30" id="signup_subdomain" value="<?php echo $form['signup_subdomain']; ?>"/>.<?php echo $domain_name; ?></p>
       				
       				<?php if(isset($form_error['signup_subdomain'])) { ?>
       				<p style="color:red">* <?php echo $form_error['signup_subdomain']; ?></p>
                    <?php } ?>
                    
                    <hr />
                    
                    <img src="<?php echo url::site(); ?>media/img/mhi/step-3.gif" align="left" class="step" /> <h2 class="step-3">Enter Your Deployment Details</h2>
                    <p>
			        	<label for="signup_instance_name">Deployment Name</label><br/>
			        	<input type="text" size="30" name="signup_instance_name" maxlength="100" id="signup_instance_name" value="<?php echo $form['signup_instance_name']; ?>" autocomplete="off"/>
			        </p>
			        <p>
			        	<label for="signup_instance_tagline">Deployment Tagline</label><br/>
			        	<input type="text" size="30" name="signup_instance_tagline" maxlength="100" id="signup_instance_tagline" value="<?php echo $form['signup_instance_tagline']; ?>" autocomplete="off"/>
			        </p>
			        
			        
			        <img src="<?php echo url::site(); ?>media/img/mhi/step-4.gif" align="left" class="step" /> <h2 class="step-4">Accept Terms</h2>
			        <p>
			        	<input type="checkbox" name="signup_tos" id="signup_tos" value="1" /> <label for="signup_tos">I have read and agree</label> to the <a href="<?php echo url::site(); ?>mhi/legal" target="_blank">Website Terms of Use</a>
			        </p>
			        
			        
			        <p>
			        	<input class="button" type="submit" value="Finish &amp; Create Deployment" />
			        </p>

            <?php print form::close(); ?>
                      
            </div></div>
            <div class="twocol-right">
              
      				<!-- right nav -->
      				<div class="side-bar-module rounded shadow" style="margin-top:410px">
      					<h4>Using Crowdmap for a crisis?</h4>
      					<div class="side-bar-content">
      						<ul class="sub-nav-links">
      							<li><a target="_blank" href="http://ushahidi.com/media/c_Crowdmap-Emergency-Response-Strategy.pdf">Follow these 5 easy steps &raquo;</a></li>
      						</ul>
      					</div>
      				</div>
      				<!-- / right nav -->

            </div>
            <div style="clear:both;"></div>
        </div>









