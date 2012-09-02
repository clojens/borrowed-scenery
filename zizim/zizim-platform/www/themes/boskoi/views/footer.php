	</div> <!-- /middle -->

	<!-- footer -->
	<div id="footer" class="clearingfix">
		Boskoi &#169; 2010, a <a href="http://fo.am/"><img src="<?=url::site()?>themes/boskoi/media/footer_logo.png" width="43" height="18" alt="Foam" align="bottom"/></a> initiative based on <a href="http://www.ushahidi.com/">Ushahidi</a>, developed by <a href="http://www.vanderBie.net">Joey van der Bie</a>, <a href="http://vdmark.info">Maarten van der Mark</a> and <a href="http://vincent.vijn.me">Vincent Vijn</a>
	</div>
	<div id="sponsors"><a href="http://www.prinsbernhardcultuurfonds.nl/" target="_blank"><img src="/themes/boskoi/media/cultuurfonds.gif" align="right" alt="Boskoi is supported by the Prins Bernhard Cultuurfonds foundation"/></a></div>
	<!-- / footer -->

	<?php echo $google_analytics; ?>
	
	<!-- Task Scheduler -->
	<img src="<?php echo url::site().'scheduler'; ?>" height="1" width="1" border="0" alt="" />
 
	<?php
	// Action::main_footer - Add items before the </body> tag
	Event::run('ushahidi_action.main_footer');
	?>

	</div>	<!-- /floatholder -->

	</body>
</html>