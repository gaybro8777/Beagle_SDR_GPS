// Copyright (c) 2017 John Seamons, ZL/KF6VO

var noise_filter = {
   ext_name: 'noise_filter',     // NB: must match noise_filter.cpp:noise_filter_ext.name
   first_time: true,

   algo: 0,
   algo_s: [ '(none selected)', 'wdsp variable-leak LMS', 'original LMS', 'Kim algorithm', 'spectral' ],
   NR_OFF: 0,
   denoise: 0,
   autonotch: 0,
   enable: [0, 0],
   
   // type
   NR_DENOISE: 0,
   NR_AUTONOTCH: 1,

   NR_WDSP: 1,
   wdsp_de_taps: 64,
   wdsp_de_delay: 16,
   wdsp_de_gain: 10,    // 0.00008
   wdsp_de_leakage: 7,  // 0.125
   wdsp_an_taps: 64,
   wdsp_an_delay: 16,
   wdsp_an_gain: 10,    // 0.00008
   wdsp_an_leakage: 7,  // 0.125
   
   NR_ORIG: 2,
   de_delay: 1,
   de_beta: 0.05,
   de_decay: 0.98,
   an_delay: 48,
   an_beta: 0.125,
   an_decay: 0.99915,

   NR_KIM: 3,

   NR_SPECTRAL: 4,
};

function noise_filter_main()
{
	ext_switch_to_client(noise_filter.ext_name, noise_filter.first_time, noise_filter_recv);		// tell server to use us (again)
	if (!noise_filter.first_time)
		noise_filter_controls_setup();
	noise_filter.first_time = false;
}

function noise_filter_recv(data)
{
	var firstChars = arrayBufferToStringLen(data, 3);
	
	// process data sent from server/C by ext_send_msg_data()
	if (firstChars == "DAT") {
		var ba = new Uint8Array(data, 4);
		var cmd = ba[0];
		var o = 1;
		var len = ba.length-1;

		console.log('noise_filter_recv: DATA UNKNOWN cmd='+ cmd +' len='+ len);
		return;
	}
	
	// process command sent from server/C by ext_send_msg() or ext_send_msg_encoded()
	var stringData = arrayBufferToString(data);
	var params = stringData.substring(4).split(" ");

	for (var i=0; i < params.length; i++) {
		var param = params[i].split("=");

		if (0 && param[0] != "keepalive") {
			if (isDefined(param[1]))
				console.log('noise_filter_recv: '+ param[0] +'='+ param[1]);
			else
				console.log('noise_filter_recv: '+ param[0]);
		}

		switch (param[0]) {

			case "ready":
				noise_filter_controls_setup();
				break;

			default:
				console.log('noise_filter_recv: UNKNOWN CMD '+ param[0]);
				break;
		}
	}
}

function noise_filter_controls_html()
{
   var s = '';
   
   switch (noise_filter.algo) {
   
   case noise_filter.NR_WDSP:
      s =
         w3_inline('w3-margin-between-16',
            w3_checkbox('w3-label-inline w3-text-css-orange/', 'Denoiser', 'noise_filter.denoise', noise_filter.denoise, 'noise_filter_cb')
         ) +
         w3_div('w3-section',
            w3_slider('', 'Taps', 'noise_filter.wdsp_de_taps', noise_filter.wdsp_de_taps, 16, 128, 1, 'nf_wdsp_taps_cb'),
            w3_slider('', 'Delay', 'noise_filter.wdsp_de_delay', noise_filter.wdsp_de_delay, 2, 128, 1, 'nf_wdsp_delay_cb'),
            w3_slider('', 'Gain', 'noise_filter.wdsp_de_gain', noise_filter.wdsp_de_gain, 1, 20, 1, 'nf_wdsp_gain_cb'),
            w3_slider('', 'Leakage', 'noise_filter.wdsp_de_leakage', noise_filter.wdsp_de_leakage, 1, 23, 1, 'nf_wdsp_leakage_cb')
         ) +
         w3_inline('w3-margin-between-16',
            w3_checkbox('w3-label-inline w3-text-css-orange/', 'Autonotch', 'noise_filter.autonotch', noise_filter.autonotch, 'noise_filter_cb')
         ) +
         w3_div('w3-section',
            w3_slider('', 'Taps', 'noise_filter.wdsp_an_taps', noise_filter.wdsp_an_taps, 16, 128, 1, 'nf_wdsp_taps_cb'),
            w3_slider('', 'Delay', 'noise_filter.wdsp_an_delay', noise_filter.wdsp_an_delay, 2, 128, 1, 'nf_wdsp_delay_cb'),
            w3_slider('', 'Gain', 'noise_filter.wdsp_an_gain', noise_filter.wdsp_an_gain, 1, 20, 1, 'nf_wdsp_gain_cb'),
            w3_slider('', 'Leakage', 'noise_filter.wdsp_an_leakage', noise_filter.wdsp_an_leakage, 1, 23, 1, 'nf_wdsp_leakage_cb')
         );
      break;
   
   case noise_filter.NR_ORIG:
      s =
         w3_inline('w3-margin-between-16',
            w3_checkbox('w3-label-inline w3-text-css-orange/', 'Denoiser', 'noise_filter.denoise', noise_filter.denoise, 'noise_filter_cb'),
            w3_button('w3-padding-tiny', 'SSB #1', 'noise_filter_de_presets_cb', 0),
            w3_button('w3-padding-tiny', 'SSB #2', 'noise_filter_de_presets_cb', 1)
         ) +
         w3_div('w3-section',
            w3_slider('', 'Delay line', 'noise_filter.de_delay', noise_filter.de_delay, 1, 200, 1, 'noise_filter_delay_cb'),
            w3_slider('', 'Beta', 'noise_filter.de_beta', noise_filter.de_beta, 0.0001, 0.150, 0.0001, 'noise_filter_beta_cb'),
            w3_slider('', 'Decay', 'noise_filter.de_decay', noise_filter.de_decay, 0.90, 1.0, 0.0001, 'noise_filter_decay_cb')
         ) +
         w3_inline('w3-margin-between-16',
            w3_checkbox('w3-label-inline w3-text-css-orange/', 'Autonotch', 'noise_filter.autonotch', noise_filter.autonotch, 'noise_filter_cb'),
            w3_button('w3-padding-tiny', 'Voice', 'noise_filter_an_presets_cb', 0),
            w3_button('w3-padding-tiny', 'Slow CW', 'noise_filter_an_presets_cb', 1),
            w3_button('w3-padding-tiny', 'Fast CW', 'noise_filter_an_presets_cb', 2)
         ) +
         w3_div('w3-section',
            w3_slider('', 'Delay line', 'noise_filter.an_delay', noise_filter.an_delay, 1, 200, 1, 'noise_filter_delay_cb'),
            w3_slider('', 'Beta', 'noise_filter.an_beta', noise_filter.an_beta, 0.0001, 0.150, 0.0001, 'noise_filter_beta_cb'),
            w3_slider('', 'Decay', 'noise_filter.an_decay', noise_filter.an_decay, 0.90, 1.0, 0.0001, 'noise_filter_decay_cb')
         );
      break;
   }
   
	var controls_html =
		w3_div('id-noise-filter-controls w3-text-white',
			w3_divs('w3-container/w3-tspace-8',
				w3_inline('w3-margin-between-8',
				   w3_div('w3-medium w3-text-aqua', '<b>Noise filter: </b>'),
				   w3_div('w3-text-white', noise_filter.algo_s[noise_filter.algo])
				),
            w3_div('w3-section', s)
         )
		);
	
	return controls_html;
}

function noise_filter_controls_setup()
{
	ext_panel_show(noise_filter_controls_html(), null, null);
	ext_set_controls_width_height(400, 475);
}

function noise_filter_init()
{
	noise_filter.algo = readCookie('last_nr_algo', 0);
	nr_algo_cb('nr_algo', noise_filter.algo, false, true);
	
   noise_filter_send();
}

function noise_filter_send()
{
   snd_send('SET nr algo='+ noise_filter.algo);
   if (noise_filter.algo == noise_filter.NR_OFF) return;

   snd_send('SET nr type=0 param=0 pval='+ noise_filter.de_delay);
   snd_send('SET nr type=0 param=1 pval='+ noise_filter.de_beta);
   snd_send('SET nr type=0 param=2 pval='+ noise_filter.de_decay);

   snd_send('SET nr type=1 param=0 pval='+ noise_filter.an_delay);
   snd_send('SET nr type=1 param=1 pval='+ noise_filter.an_beta);
   snd_send('SET nr type=1 param=2 pval='+ noise_filter.an_decay);

   snd_send('SET nr type=0 en='+ noise_filter.enable[0]);
   snd_send('SET nr type=1 en='+ noise_filter.enable[1]);
}

function nr_algo_cb(path, idx, first, init)
{
   //console.log('nr_algo_cb idx='+ idx +' first='+ first +' init='+ init);
   if (first) return;
   idx = +idx;
   w3_select_value(path, idx);
   noise_filter.algo = idx;
   writeCookie('last_nr_algo', idx.toString());
   if (init != true) noise_filter_send();

	if (ext_panel_displayed()) {
	   ext_panel_redisplay(noise_filter_controls_html());
	}
}


function noise_filter_cb(path, checked, first)
{
   checked = checked? 1:0;
   console.log('noise_filter_cb '+ checked +' path='+ path);
   setVarFromString(path, checked);
   w3_checkbox_set(path, checked);
   var type = path.includes('denoise')? 0:1;
   noise_filter.enable[type] = checked;
   noise_filter_send();
}


// NR_WDSP

function nf_wdsp_taps_cb(path, val, complete, first)
{
   val = +val;
   if (val < noise_filter.wdsp_de_delay) val = noise_filter.wdsp_de_delay;
	w3_num_cb(path, val);
	w3_set_label('Taps: '+ val, path);
	var type = path.includes('de_')? 0:1;
	if (complete) {
	   //console.log(path +' val='+ val);
      snd_send('SET nr type='+ type +' param=0 pval='+ val);
	}
}

function nf_wdsp_delay_cb(path, val, complete, first)
{
   val = +val;
   if (val > noise_filter.wdsp_de_taps) val = noise_filter.wdsp_de_taps;
	w3_num_cb(path, val);
	w3_set_label('Delay: '+ val, path);
	var type = path.includes('de_')? 0:1;
	if (complete) {
	   //console.log(path +' val='+ val);
      snd_send('SET nr type='+ type +' param=0 pval='+ val);
	}
}

function nf_wdsp_gain_cb(path, val, complete, first)
{
   val = +val;
	w3_num_cb(path, val);
	var gain = 8.192e-2 / Math.pow(2, 20 - val);
	w3_set_label('Gain: '+ gain.toExponential(2), path);
	var type = path.includes('de_')? 0:1;
	if (complete) {
	   console.log(path +' gain='+ gain);
      snd_send('SET nr type='+ type +' param=0 pval='+ gain);
	}
}

function nf_wdsp_leakage_cb(path, val, complete, first)
{
   val = +val;
	w3_num_cb(path, val);
	var leakage = 8192 / Math.pow(2, 23 - val);
	w3_set_label('Leakage: '+ leakage.toExponential(2), path);
	var type = path.includes('de_')? 0:1;
	if (complete) {
	   console.log(path +' leakage='+ leakage);
      snd_send('SET nr type='+ type +' param=0 pval='+ leakage);
	}
}


// NR_ORIG

var noise_filter_de_presets = [
   1,    0.05,    0.98,
   100,  0.07,    0.985
];

function noise_filter_de_presets_cb(path, idx, first)
{
   var p = noise_filter_de_presets;
   w3_slider_set('noise_filter.de_delay', p[idx*3], 'noise_filter_delay_cb');
   w3_slider_set('noise_filter.de_beta', p[idx*3+1], 'noise_filter_beta_cb');
   w3_slider_set('noise_filter.de_decay', p[idx*3+2], 'noise_filter_decay_cb');
}

var noise_filter_an_presets = [
   48,   0.125,   0.99915,
   48,   0.002,   0.9998,
   48,   0.001,   0.9980
];

function noise_filter_an_presets_cb(path, idx, first)
{
   var p = noise_filter_an_presets;
   w3_slider_set('noise_filter.an_delay', p[idx*3], 'noise_filter_delay_cb');
   w3_slider_set('noise_filter.an_beta', p[idx*3+1], 'noise_filter_beta_cb');
   w3_slider_set('noise_filter.an_decay', p[idx*3+2], 'noise_filter_decay_cb');
   /*
   w3_menu_items('id-right-click-menu',
      'defaults',
      'CW signals'
   );
   w3_menu_popup('id-noise-filter-presets-menu', x, y);
   */
}

function noise_filter_delay_cb(path, val, complete, first)
{
   val = +val;
	w3_num_cb(path, val);
	w3_set_label('Delay line: '+ (val +' samp'+ ((val == 1)? '':'s') +', '+ (val * 1/12000 * 1e3).toFixed(3) +' msec'), path);
	var type = path.includes('de_')? 0:1;
	if (complete) {
	   //console.log(path +' val='+ val);
      snd_send('SET nr type='+ type +' param=0 pval='+ val);
	}
}

function noise_filter_beta_cb(path, val, complete, first)
{
   val = +val;
	w3_num_cb(path, val);
	w3_set_label('Beta: '+ val.toFixed(4), path);
	var type = path.includes('de_')? 0:1;
	if (complete) {
	   //console.log(path +' val='+ val);
      snd_send('SET nr type='+ type +' param=1 pval='+ val);
	}
}

function noise_filter_decay_cb(path, val, complete, first)
{
   val = +val;
	w3_num_cb(path, val);
	w3_set_label('Decay: '+ val.toFixed(4), path);
	var type = path.includes('de_')? 0:1;
	if (complete) {
	   //console.log(path +' val='+ val);
      snd_send('SET nr type='+ type +' param=2 pval='+ val);
	}
}