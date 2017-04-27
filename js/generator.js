//----------------------------------------------------------------------------------------------------------------------
var msg_tpl =
    '<div class="msg">' +
    '<span class="time">%1%</span>' +
    '<span class="from" style="color: %2%;">~testuser~</span>' +
    '<span class="text">hsv(%3%)</span>' +
    '</div>';
//----------------------------------------------------------------------------------------------------------------------
/**
 * Main function here, entry point.
 * @param e event
 */
function just_do_it(e)
{
    e.preventDefault();
    document.getElementById("preview").innerHTML = '';
    document.getElementById("result").value = '';

    // inputs
    var hues = [];
    hues.push(document.getElementById("hues").value);

    var add_grey = [];
    add_grey.push(document.getElementById("add_grey").checked);
    add_grey.push(parseInt(document.getElementById("add_grey_v1").value));
    add_grey.push(parseInt(document.getElementById("add_grey_v2").value));

    var reduce_bright = [];
    reduce_bright.push(document.getElementById("reduce_bright").checked);
    reduce_bright.push(parseInt(document.getElementById("reduce_bright_s1").value));
    reduce_bright.push(document.getElementById("bright_hues_rv").value);

    var reduce_saturation = [];
    reduce_saturation.push(document.getElementById("reduce_saturation").checked);
    reduce_saturation.push(parseInt(document.getElementById("reduce_saturation_s1").value));
    reduce_saturation.push(parseInt(document.getElementById("reduce_saturation_s2").value));
    reduce_saturation.push(document.getElementById("bright_hues_rs").value);

    var s_ign_zone = [];
    s_ign_zone.push(document.getElementById("s_ign_zone").checked);
    s_ign_zone.push(parseInt(document.getElementById("s_ign_zone_s1").value));
    s_ign_zone.push(document.getElementById("bright_hues_i").value);

    var skip_dark = [];
    skip_dark.push(document.getElementById("skip_dark").checked);
    skip_dark.push(parseInt(document.getElementById("skip_dark_v1").value));
    skip_dark.push(document.getElementById("dark_hues_s").value);

    var skip_bright = [];
    skip_bright.push(document.getElementById("skip_bright").checked);
    skip_bright.push(parseInt(document.getElementById("skip_bright_v1").value));
    skip_bright.push(document.getElementById("bright_hues_s").value);

    var ignore_list = document.getElementById("ignore_list").value.split(/\n/);

    var use_short = document.getElementById("use_short").checked;

    var shades_input = [];
    for(var i = 1; i <= 12; i++)
    {
        if(document.getElementById("S"+i).value && document.getElementById("V"+i).value)
        {
            shades_input.push(
                [parseInt(document.getElementById("S"+i).value), parseInt(document.getElementById("V"+i).value)]
            )
        }
    }
    // /inputs

    var colors = generate_colors(
        hues, shades_input, reduce_bright, reduce_saturation, s_ign_zone, skip_dark, skip_bright, add_grey,
        ignore_list, use_short
    );
    var n = 0;
    colors.forEach(function(hue)
    {
        hue.forEach(function(color)
        {
            n++;
            document.getElementById("preview").innerHTML += (
                msg_tpl.replace("%1%", str_pad2(n, "00:00")).replace("%2%", color[0]).replace("%3%", color[1].join(', '))
            );
            document.getElementById("result").value += (
                "#chat.colored-nicks .user.color-"+n+" { color: "+color[0]+"; }\n"
            );
        });
    });

    document.getElementById("preview").classList.remove("hide");
    document.getElementById("result_wrap").classList.remove("hide");
}
//----------------------------------------------------------------------------------------------------------------------
/**
 * Core function, which does the trick.
 * @param hues_input array
 * @param shades_input array
 * @param reduce_bright array
 * @param reduce_saturation array
 * @param s_ign_zone array
 * @param skip_dark array
 * @param skip_bright array
 * @param add_grey array
 * @param ignore_list array
 * @param use_short bool
 * @returns {Array}
 */
function generate_colors(
    hues_input, shades_input, reduce_bright, reduce_saturation, s_ign_zone, skip_dark, skip_bright, add_grey,
    ignore_list, use_short
)
{
    var final = [];

    //var hues = [0, 6, 9, 16, 24, 33, 38, 60, 79, 82, 90, 120, 149, 159, 180, 182, 185, 207, 224, 240, 248, 271, 276, 300, 302, 332, 340];

    var hues = hues_input[0].split(',').map(Number);
    var hues_dark_skip = skip_dark[2].split(',').map(Number);
    var hues_bright_skip = skip_bright[2].split(',').map(Number);
    var hues_bright_reduce_value = reduce_bright[2].split(',').map(Number);
    var hues_bright_reduce_saturation = reduce_saturation[3].split(',').map(Number);
    var hues_bright_ignore = s_ign_zone[2].split(',').map(Number);

    hues.forEach(function(i)
    {
        shades_input.forEach(function(shade)
        {
            if(final[i] === undefined) final[i] = []; // fix
            var s = shade[0];
            var v = shade[1];

            if(skip_dark[0] && v < skip_dark[1] && hues_dark_skip.indexOf(i) !== -1) return;

            if(skip_bright[0] && s < skip_bright[1] && hues_bright_skip.indexOf(i) !== -1) return;

            if(s_ign_zone[0] && hues_bright_ignore.indexOf(i) !== -1 && s < s_ign_zone[1]) return;

            if(reduce_bright[0] && hues_bright_reduce_value.indexOf(i) !== -1) v -= reduce_bright[1];

            if(reduce_saturation[0] && hues_bright_reduce_saturation.indexOf(i) !== -1 && s < reduce_saturation[2])
                s -= reduce_saturation[1];

            if(!in_ignore(ignore_list, i, s, v)) final[i].push([hsv2hex(i, s, v, use_short), [i, s, v]]);
        });
    });

    if(add_grey[0])
    {
        final[360] = [];
        for(var v=add_grey[1];v<=100;v+=add_grey[2])
        {
            if(!in_ignore(ignore_list, 360, 0, v)) final[360].push([hsv2hex(360, 0, v, use_short), [360, 0, v]]);
        }
    }

    return final;
}
//----------------------------------------------------------------------------------------------------------------------
/**
 * Check if color is in ignore list.
 * @param ignore_list array
 * @param h int
 * @param s int
 * @param v int
 * @returns {boolean}
 */
function in_ignore(ignore_list, h, s, v)
{
    var ignore = false;
    if(ignore_list)
    {
        ignore_list.forEach(function (hsv_ignore)
        {
            var values = hsv_ignore.split(', ');
            if(parseInt(values[0]) === h && parseInt(values[1]) === s && parseInt(values[2]) === v)
                ignore = true;
        });
    }
    return ignore;
}
//----------------------------------------------------------------------------------------------------------------------
/**
 * HSV to HEX converter.
 *
 * H runs from 0 to 360 degrees
 * S and V run from 0 to 100
 * Ported from the excellent java algorithm by Eugene Vishnevsky at:
 * http://www.cs.rit.edu/~ncs/color/t_convert.html
 * @param h int
 * @param s int
 * @param v int
 * @param short bool
 * @returns {string}
*/
function hsv2hex(h, s, v, short)
{
    var r, g, b;
    var i;
    var f, p, q, t;

    // Make sure our arguments stay in-range
    h = Math.max(0, Math.min(360, h));
    s = Math.max(0, Math.min(100, s));
    v = Math.max(0, Math.min(100, v));

    s /= 100;
    v /= 100;

    if(s === 0) {
        // Achromatic (grey)
        r = g = b = v;
        return rgb2hex([
            Math.round(r * 255),
            Math.round(g * 255),
            Math.round(b * 255)
        ], short);
    }

    h /= 60; // sector 0 to 5
    i = Math.floor(h);
    f = h - i; // factorial part of h
    p = v * (1 - s);
    q = v * (1 - s * f);
    t = v * (1 - s * (1 - f));

    switch(i) {
        case 0:
            r = v;
            g = t;
            b = p;
            break;

        case 1:
            r = q;
            g = v;
            b = p;
            break;

        case 2:
            r = p;
            g = v;
            b = t;
            break;

        case 3:
            r = p;
            g = q;
            b = v;
            break;

        case 4:
            r = t;
            g = p;
            b = v;
            break;

        default: // case 5:
            r = v;
            g = p;
            b = q;
    }

    return rgb2hex([
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255)
    ], short);
}
//----------------------------------------------------------------------------------------------------------------------
/**
 * RGB to HEX converter.
 * @param rgb array
 * @param short bool
 * @returns {string} HEX
 */
function rgb2hex(rgb, short)
{
    var hex = "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
    return short ? hex.replace(/#([0-9A-f])\1([0-9A-f])\2([0-9A-f])\3/, '#$1$2$3') : hex;
}
//----------------------------------------------------------------------------------------------------------------------
/**
 * Javascript version of str_pad.
 * @param int
 * @param pad design type
 * @returns {string}
 */
function str_pad2(int, pad)
{
    return pad.substring(0, pad.length - int.toString().length) + int.toString();
}
//----------------------------------------------------------------------------------------------------------------------
