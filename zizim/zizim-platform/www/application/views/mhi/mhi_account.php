<?php
/**
 * MHI - Manage Account
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
                <h2>Manage Your Account</h2>
				<div class="tabs">
                	<ul>
                    	<li><a class="" href="<?php echo url::site() ?>mhi/manage">Your Deployments</a></li>
                    	<li><a class="ab-active" href="<?php echo url::site() ?>mhi/account">Account Settings</a></li>
                    </ul>
                </div>
				<h3>Account Settings</h3>
				<?php if ($success_message != '') { ?>
					<div style="background-color:#95C274;border:4px #8CB063 solid;padding:2px 8px 1px 8px;margin:10px;"><?php echo $success_message; ?></div>
				<?php } ?>

				<?php print form::open(url::site().'mhi/account', array('id' => 'frm-MHI-Account', 'name' => 'frm-MHI-Account', 'class' => 'frm-content')); ?>
			
				<table><tbody>
			
					<?php if ($form_error) { ?>
			        <tr>
			          	<td align="left" class="error" colspan="2">
						<?php
						foreach ($errors as $error_item => $error_description)
						{
							echo '&#8226; '.$error_description.'<br />';
						}
						?>
						</td>
			        </tr>
					<?php } ?>
			
				    <tr>
				      <td><label for="firstname">First name</label></td>
				      <td><input type="text" size="24" name="firstname" maxlength="42" id="firstname" value="<?php echo $user->firstname; ?>" />
				      <span><em>Required.</em></span></td>
				    </tr>
				    <tr>
				      <td><label for="lastname">Last name</label></td>
				      <td><input type="text" size="24" name="lastname" maxlength="42" id="lastname" value="<?php echo $user->lastname; ?>" />
				      <span><em>Required.</em></span></td>
				    </tr>
				    <tr>
				      <td><label for="email">Email</label></td>
				      <td><input type="text" size="24" name="email" maxlength="42" id="email" value="<?php echo $user->email; ?>" />
				      <span><em>Required.</em> This is also your username.</span></td>
				    </tr>
				    <tr>
				      <td><label for="account_password">Password</label></td>
				      <td><input type="password" size="24" name="account_password" maxlength="32" id="account_password"/>
				      <span>Use 4 to 32 characters.</span></td>
				    </tr>
				    <tr>
				      <td><label for="account_confirm_password">Confirm Password</label></td>
				      <td><input type="password" size="24" name="account_confirm_password" maxlength="32" id="account_confirm_password"/></td>
				    </tr>
				</tbody></table>
			
				<p>
					<input class="button" type="submit" value="Update Account" />
				</p>
			
			<?php print form::close(); ?>
                
                
                    
            </div></div>
            <div class="twocol-right">
                <p class="side-bar-buttons"><a class="admin-button green" href="<?php echo url::site() ?>mhi/signup">New Deployment</a></p>
            </div>
            <div style="clear:both;"></div>
        </div>