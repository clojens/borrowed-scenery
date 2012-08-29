<div id="content">
	<div class="content-bg">
		<?=form::open(NULL, array('id' => 'categoryForm', 'name' => 'categoryForm'))?>
		<div class="big-block">
			<h1>Suggest a new category</h1>
			
			<!-- Validation errors -->
			<? if ($form_error): ?>
				<div class="red-box">
					<h3>There was a problem with your form entry:</h3>
						<ul>
							<?php
								foreach ($errors as $error_item => $error_description)
								{
									print (!$error_description) ? '' : "<li>" . $error_description . "</li>";
								}
							?>
						</ul>
				  </div>
			<? endif; ?>
			
			<!-- Confirmation message -->
			<? if ($form_sent): ?>
				<div class="green-box">
					<h3>Your message has been sent. Thank you for your suggestion!</h3>
				</div>
			<? endif; ?>
			
			
			<div class="report_row">
				<strong>Your Name:</strong><br />
				<?=form::input('contact_name', $form['contact_name'], ' class="text"')?>
			</div>

			<div class="report_row">
				<strong>Your E-Mail Address:</strong><br />
				<?=form::input('contact_email', $form['contact_email'], ' class="text"')?>
			</div>
			
			<div class="report_row">
				<strong>Suggested category:</strong><br />
				<?=form::input('category_name', $form['category_name'], ' class="text"')?>
			</div>
			
			<div class="report_row">
				<strong>Additional info:</strong><br />
				<?=form::textarea('category_info', $form['category_info'], ' rows="4" cols="40" class="textarea long" ')?>
			</div>		

			<div class="report_row">
				<input name="submit" type="submit" value="Suggest category" class="btn_submit" />
			</div>
			<?=form::close()?>			
			
		</div>
	</div>
</div>