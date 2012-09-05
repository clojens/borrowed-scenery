<div id="main" class="clearingfix">
	<div id="mainmiddle" class="floatbox withright">
		<!-- start incident block -->
		<div class="reports">
			<div class="report-details">
				<div class="verified <?php
				if ($incident_verified == 1)
				{
					echo " verified_yes";
				}
				?>"><?php
					echo ($incident_verified == 1) ?
						"<span>Verified</span>" :
						"<span>Unverified</span>";
					?>
				</div>
				<h1><?php
				echo $incident_title;
				
				// If Admin is Logged In - Allow For Edit Link
				if ($logged_in)
				{
					echo " [&nbsp;<a href=\"".url::site()."admin/reports/edit/".$incident_id."\">Edit</a>&nbsp;]";
				}
				?></h1>
				<ul class="details">
					<li>
						<small>Location</small>
						<?php echo $incident_location; ?>
					</li>
					<li>
						<small>Date</small>
						<?php echo $incident_date; ?>
					</li>
					<li>
						<small>Time</small>
						<?php echo $incident_time; ?>
					</li>
					<li>
						<small>Category</small>
						<?php
							foreach($incident_category as $category) 
							{ 
								echo "<a href=\"".url::site()."reports/?c=".$category->category->id."\">" .
								$category->category->category_title ." (".$category->category->category_title_la .")</a>&nbsp;&nbsp;&nbsp;";
							}
						?>
					</li>
					<li>
						<small>More info</small>
						<?php 
						foreach($incident_category as $category) 
						{ 
							if($category->category->category_title != "Not available"){
								//replace spaces for wikipedia url
								$new_title = str_replace(" ","%20",$category->category->category_title_la);
								echo "<a href=http://en.wikipedia.org/w/index.php?title=Special%3ASearch&search=".$new_title.">" . $category->category->category_title ." on Wikipedia</a> </br>";
							}
						}
			
						?>
					</li>
					<?php
					// Action::report_meta - Add Items to the Report Meta (Location/Date/Time etc.)
					Event::run('ushahidi_action.report_meta', $incident_id);
					?>
				</ul>
			</div>
			<div class="location">
				<div class="incident-notation clearingfix">
					<ul>
						<li><img align="absmiddle" alt="Incident" src="<?php echo url::base(); ?>media/img/incident-pointer.jpg"/> This Report</li>
						<li><img align="absmiddle" alt="Nearby Incident" src="<?php echo url::base(); ?>media/img/nearby-incident-pointer.jpg"/> Nearby Reports</li>
					</ul>
				</div>
				<div class="report-map">
					<div class="map-holder" id="map"></div>
				</div>
			</div>
		</div>
	</div>
</div>

<div class="report-description">
	<h3>Edible Report Description</h3>
		<div class="content">
			<?php echo $incident_description; ?>
			<div class="credibility">
				Credibility:
				<a href="javascript:rating('<?php echo $incident_id; ?>','add','original','oloader_<?php echo $incident_id; ?>')"><img id="oup_<?php echo $incident_id; ?>" src="<?php echo url::base() . 'media/img/'; ?>thumb-up.jpg" alt="UP" title="UP" border="0" /></a>&nbsp;
				<a href="javascript:rating('<?php echo $incident_id; ?>','subtract','original')"><img id="odown_<?php echo $incident_id; ?>" src="<?php echo url::base() . 'media/img/'; ?>thumb-down.jpg" alt="DOWN" title="DOWN" border="0" /></a>&nbsp;
				<a href="" class="rating_value" id="orating_<?php echo $incident_id; ?>"><?php echo $incident_rating; ?></a>
				<a href="" id="oloader_<?php echo $incident_id; ?>" class="rating_loading" ></a>
			</div>
		</div>
		<a name="discussion"></a>
		<?php
		// Action::report_extra - Add Items to the Report Extra block
		Event::run('ushahidi_action.report_extra', $incident_id);
		
		// Filter::comments_block - The block that contains posted comments
		Event::run('ushahidi_filter.comment_block', $comments);
		echo $comments;
		?>		
	</div>

	<?php
	if( count($incident_photos) > 0 ) 
	{
	?>
	<!-- start images -->
	<div class="report-description">
		<h3>Images</h3>
		<div class="photos">
			<?php
			foreach ($incident_photos as $photo)
			{
				$thumb = str_replace(".","_t.",$photo);
				$prefix = url::base().Kohana::config('upload.relative_directory');
				echo("<img src='$prefix/$photo'/>");
			}
			?>
		</div>
	</div>

	<!-- end images <> start side block -->
	<?php
	}?>


	<div class="report-description">
		<h3>Nearby Report(s)</h3>
		<table cellpadding="0" cellspacing="0">
			<tr class="title">
				<th class="w-01">TITLE</th>
				<th class="w-02">LOCATION</th>
				<th class="w-03">DATE</th>
			</tr>
			<?php
				foreach($incident_neighbors as $neighbor)
				{
					echo "<tr>";
					echo "<td class=\"w-01\"><a href=\"" . url::site(); 
					echo "reports/view/" . $neighbor->id . "\">" . $neighbor->incident_title . "</a></td>";
					echo "<td class=\"w-02\">" . $neighbor->location->location_name . "</td>";
					echo "<td class=\"w-03\">" . date('M j Y', strtotime($neighbor->incident_date)) . "</td>";
					echo "</tr>";
				}
				?>
		</table>
	</div>

	
	
	<!-- start videos -->
	<?php
		if( count($incident_videos) > 0 ) 
		{
	?>
	<div class="report-description">
		<h3>Videos</h3>
		<div class="block-bg">
			<div style="overflow:auto; white-space: nowrap; padding: 10px">
				<?php
					// embed the video codes
					foreach( $incident_videos as $incident_video) {
						$videos_embed->embed($incident_video,'');
					}
				?>
			</div>
		</div>
		<?php } ?>
	</div>
	<!-- end incident block <> start other report -->
	
	<?php
	// Filter::comments_form_block - The block that contains the comments form
	Event::run('ushahidi_filter.comment_form_block', $comments_form);
	echo $comments_form;
	?>
	
</div>