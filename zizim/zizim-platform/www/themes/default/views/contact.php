<div id="content">
	<div class="content-bg">
		<!-- start contacts block -->
		<div class="big-block">
			<h1><?php echo Kohana::lang('ui_main.contact'); ?></h1>
			        <p>
				If you'd like to drop by our lab, this is the address:
				<p>
				Snoepwinkel<br/>
				attn. Borrowed Scenery<br/>
				Sint-Pietersnieuwstraat 21,<br/>
				9000 Gent<br/>
				(the lab is open from 1PM - 7 PM daily, except on Mondays).<br/>
				</p></p>
			<div id="contact_us" class="contact">
				<?php
				if ($form_error)
				{
					?>
					<!-- red-box -->
					<div class="red-box">
						<h3>Error!</h3>
						<ul>
							<?php
							foreach ($errors as $error_item => $error_description)
							{
								print (!$error_description) ? '' : "<li>" . $error_description . "</li>";
							}
							?>
						</ul>
					</div>
					<?php
				}

				if ($form_sent)
				{
					?>
					<!-- green-box -->
					<div class="green-box">
						<h3>Your Message Has Been Sent!</h3>
					</div>
					<?php
				}								
				?>
				<?php print form::open(NULL, array('id' => 'contactForm', 'name' => 'contactForm')); ?>
				<div class="report_row">
					<strong>What is your name?</strong><br />
					<?php print form::input('contact_name', $form['contact_name'], ' class="text"'); ?>
				</div>
				<div class="report_row">
					<strong>What is your email address?</strong><br />
					<?php print form::input('contact_email', $form['contact_email'], ' class="text"'); ?>
				</div>
				<div class="report_row">
					What is your telephone number?<br />
					<?php print form::input('contact_phone', $form['contact_phone'], ' class="text"'); ?>
				</div>
				<div class="report_row">
					<strong>Please give a title to your correspondence.</strong><br />
					<?php print form::input('contact_subject', $form['contact_subject'], ' class="text"'); ?>
				</div>								
				<div class="report_row">
					<strong>Please include your corresepondence below.</strong><br />
					<?php print form::textarea('contact_message', $form['contact_message'], ' rows="4" cols="40" class="textarea long" ') ?>
				</div>		
				<div class="report_row">
					<strong>Security Code:</strong><br />
					<?php print $captcha->render(); ?><br />
					<?php print form::input('captcha', $form['captcha'], ' class="text"'); ?>
				</div>
				<div class="report_row">
					<input name="submit" type="submit" value="Dispatch your correspondence" class="btn_submit" />
				</div>
				<?php print form::close(); ?>
			</div>
			
		</div>
		<!-- end contacts block -->
	</div>
</div>