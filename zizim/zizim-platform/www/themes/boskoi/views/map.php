<!-- main body -->
<div id="main" style="padding: 0px 0px 0px 0px;" class="clearingfix">
	<div id="mainmiddle" style="margin: 0px 0px 0px 0px;" class="floatbox withright">

		<!-- content column -->
		<div id="content" class="clearingfix">
			<div class="floatbox">
			
				<!-- filters -->
				<div class="filters clearingfix">
					<div style="float:left; width: 65%">
						<strong><?php echo Kohana::lang('ui_main.filters'); ?></strong>
	
					</div>
					<?php
					// Action::main_filters - Add items to the main_filters
					Event::run('ushahidi_action.map_main_filters');
					?>
				</div>
				<!-- / filters -->
				
				<?php								
				// Map and Timeline Blocks
				echo $div_map;
				?>
				
				<div id="hiding" style="position: relative; display:none; ">
				<?php
				echo $div_timeline;
				?>
				</div>
			</div>
		</div>
		<!-- / content column -->

				<!-- right column -->
		<div id="right" class="clearingfix">
	
			<!-- category filters -->
			<div class="cat-filters">
				<strong><?php echo Kohana::lang('ui_main.category_filter');
				$language = "english";
				if (!empty($_GET["lang"])) {
					$language = $_GET["lang"];
					}

				?> <span>[<a href="javascript:toggleLayer('category_switch_link', 'category_switch')" id="category_switch_link"><?php echo Kohana::lang('ui_main.hide'); ?></a>]</span></strong>
			</div>
		
			<ul class="category-filters">
				<li><form action="" ><select  style="width: 100%" id="lang" name="lang"  onchange="this.form.submit()" > 
					<option value="english">English</option> 
					<?php echo "<option value='dutch'"; if($language != 'english'){echo 'selected="selected"';} echo ">Dutch </option>"; ?> 
				</select></form></li> </br>

				<li><a class="active" id="cat_0" href="#"><div class="swatch" style="background-color:#<?php echo $default_map_all;?>"></div><div class="category-title"><?php echo Kohana::lang('ui_main.all_categories');?></div></a></li>
				
				<?php
					
					foreach ($categories as $category => $category_info)
					{
						$category_title = $category_info[0];
						$category_color = $category_info[1];
						$category_title_la = $category_info[2];
						$category_title_nl = $category_info[3];
						$category_image = '';
						$color_css = 'class="swatch" style="background-color:#'.$category_color.'"';
						if($category_info[2] != NULL && file_exists(Kohana::config('upload.relative_directory').'/'.$category_info[2])) {
							$category_image = html::image(array(
								'src'=>Kohana::config('upload.relative_directory').'/'.$category_info[2],
								'style'=>'float:left;padding-right:5px;'
								));
							$color_css = '';
						}
						echo '<li><a href="#" title="'.$category_title_la.'" id="cat_'. $category .'"><div '.$color_css.'>'.$category_image.'</div><div class="category-title">'.($language == 'english' ? $category_title : $category_title_nl).'</div></a>';
						// Get Children
						echo '<div class="hide" id="child_'. $category .'"><ul>';
						foreach ($category_info[5] as $child => $child_info)
						{
							$child_title = $child_info[0];
							$child_color = $child_info[1];
							$child_title_la = $child_info[2];
							$child_title_nl = $child_info[3];
							
							$child_image = '';
							$color_css = 'class="swatch" style="background-color:#'.$child_color.'"';
							if($child_info[2] != NULL && file_exists(Kohana::config('upload.relative_directory').'/'.$child_info[2])) {
								$child_image = html::image(array(
									'src'=>Kohana::config('upload.relative_directory').'/'.$child_info[2],
									'style'=>'float:left;padding-right:5px;'
									));
								$color_css = '';
							}
							echo '<li style="padding-left:20px;"><a href="#" title="'.$child_title_la.'" id="cat_'. $child .'"><div '.$color_css.'>'.$child_image.'</div><div class="category-title">'.($language == 'english' ? $child_title : $child_title_nl).'</div></a></li>';
						}
						echo '</ul></div></li>';
					}
				?>
			</ul>
			<!-- / category filters -->
			</div>
			

		<!-- / right column -->
	
		
	</div>
</div>
<!-- / main body -->

