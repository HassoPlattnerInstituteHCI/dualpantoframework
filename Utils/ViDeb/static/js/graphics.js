
var s = Snap('#svg');

const height = s.node.clientHeight,
       width = s.node.clientWidth;
var config
var style=
{
    "lineattr":{
        "fill": "#fc0",
        "stroke": "#000", 
        "strokeWidth":1
    }
};
$.getJSON("js/LP_PCB.json", function(json){
    $.ajaxSetup({async:false});
    config = json;
    $.ajaxSetup({async:true});
    draw(0,0);
});


function draw(_t1, _t2){
    s.clear();
    var t1 = _t1;
    var t2 = _t2;

    var panto = config.pantos.upper;
    var ml = s.circle(panto.left.linkage.baseX, panto.left.linkage.baseY, 5).attr({fill:"red"});
    var mr = s.circle(panto.right.linkage.baseX, panto.right.linkage.baseY, 5).attr({fill:"black"});
    var il = s.line(panto.left.linkage.baseX, panto.left.linkage.baseY,
                    panto.left.linkage.baseX+panto.left.linkage.innerLength * Math.cos(t1),
                    panto.left.linkage.baseY+panto.left.linkage.innerLength * Math.sin(t1)).attr(style.lineattr);
    var ir = s.line(panto.right.linkage.baseX, panto.right.linkage.baseY,
                    panto.right.linkage.baseX+panto.right.linkage.innerLength * Math.cos(t2),
                    panto.right.linkage.baseY+panto.right.linkage.innerLength * Math.sin(t2)).attr(style.lineattr);
    
    var a1 = panto.left.linkage.innerLength;
    var a2 = panto.left.linkage.outerLength;
    var a3 = panto.right.linkage.outerLength;
    var a4 = panto.right.linkage.innerLength;

    var P2 = new Vector(a1 * Math.cos(t1), a1 * Math.sin(t1));
    var P4 = new Vector(a4 * Math.cos(t2) + Math.abs(panto.left.linkage.baseX)+panto.right.linkage.baseX, a4 * Math.sin(t2));


    var P4_2 = P4.subtract(P2);
    var P42  = P4_2.length();
    var P2h = (a2*a2 - a3*a3 + P42*P42) / (2 * P42);
    var Ph =  P2.add(P4_2.scaled(P2h / P42));
    var P3h = Math.sqrt(a2*a2 - P2h*P2h);

    var P3 = new Vector(Ph.x - P3h/P42 * (P4.y - P2.y),Ph.y + P3h/P42 * (P4.x-P2.x));

    var ee = s.circle(P3.x + panto.left.linkage.baseX, P3.y, 5).attr({fill:"green"});
    var e2 = s.circle(P2.x + panto.left.linkage.baseX, P2.y, 5).attr({fill:"blue"});
    var e4 = s.circle(P4.x + panto.left.linkage.baseX, P4.y, 5).attr({fill:"orange"});
    
    var g = s.group(ml, mr, il, ir, ee, e2, e4)
    g.transform('t 400, 100')
}

var slider = document.getElementById("myRange");
slider.oninput = function(){
    draw(slider.value/1000, 0);
}