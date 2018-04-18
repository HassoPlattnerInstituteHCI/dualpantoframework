
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
    draw(0,0,0,0);
});



function draw(_t1, _t2, _t3, _t4){ //TODO: ForwardKinematics
    s.clear();
    // var panto = config.pantos.upper;
    let pantos = [config.pantos.upper, config.pantos.lower];
    for(panto of pantos){
        var t1 = panto == config.pantos.upper ? _t1 : _t3;
        var t2 = panto == config.pantos.upper ? _t2 : _t4;
        
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
        var ol = s.line(P2.x + panto.left.linkage.baseX, P2.y,
                        P3.x + panto.left.linkage.baseX, P3.y,).attr(style.lineattr);
        var or = s.line(P4.x + panto.left.linkage.baseX, P4.y,
            P3.x + panto.left.linkage.baseX, P3.y,).attr(style.lineattr);
        var ee = s.circle(P3.x + panto.left.linkage.baseX, P3.y, 5).attr({fill:"green"});
        // var e2 = s.circle(P2.x + panto.left.linkage.baseX, P2.y, 5).attr({fill:"blue"});
        // var e4 = s.circle(P4.x + panto.left.linkage.baseX, P4.y, 5).attr({fill:"orange"});
        
        var g = s.group(ml, mr, il, ir, ol, or, ee);
        g.transform('T 150 50');
    }   
}

function inverseKinematics(ee_x, ee_y, _ee_x, _ee_y) {
    let pantos = [config.pantos.upper, config.pantos.lower];
    let t1, t2, t3, t4;
    for(panto of pantos){
        var a1 = panto.left.linkage.innerLength;
        var a2 = panto.left.linkage.outerLength;
        var a3 = panto.right.linkage.outerLength;
        var a4 = panto.right.linkage.innerLength;
        var a5 = panto.right.linkage.baseX - panto.left.linkage.baseX;
        var P1 = new Vector(panto.left.linkage.baseX, panto.left.linkage.baseY);
        var P5 = new Vector(panto.right.linkage.baseX, panto.right.linkage.baseY);
        var P3 = new Vector(ee_x, ee_y);

        const P13 = P1.subtract(P3).length();
        const P53 = P5.subtract(P3).length();
        
        const alpha_1 = Math.acos((a1*a1 - a2*a2 + P13*P13)/(2*a1*P13));
        const beta_1  = Math.atan2(P3.y, -P3.x-P1.x);
        const beta_5  = Math.acos((a4*a4 - a3*a3 + P53*P53)/(2*a4*P53));
        const alpha_5 = Math.atan2(P3.y, P3.x + a5);
        if(panto == config.pantos.upper){
            t1 = alpha_1 + beta_1;
            t2 = Math.PI - alpha_5 - beta_5;
        }
        else{
            t3 = alpha_1 + beta_1;
            t4 = Math.PI - alpha_5 - beta_5;
        }
    }
    if(!isNaN(t1) && !isNaN(t2) && !isNaN(t3) && !isNaN(t4))
        draw(t1, t2, t3, t4);
}

var slider = document.getElementById("myRange");
var slider2 = document.getElementById("myRange2");
slider.oninput = function(){
    inverseKinematics(slider.value/10, slider2.value/10, slider.value/10, slider2.value/10);
}
slider2.oninput= function(){
    inverseKinematics(slider.value/10, slider2.value/10, slider.value/10, slider2.value/10);
}