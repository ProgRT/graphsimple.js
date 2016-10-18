var gs = {};

gs.animer = function(graph){
	if(graph.curAnim < graph.animations.length){
		graph.animations[graph.curAnim]();
		graph.curAnim ++;
	}
};

gs.stat = function(iddiv, respd){
	var tableau = "<table style='float:top'>";
	tableau += "<tr><td>P<small>A</small>CO₂:</td><td>" + Math.round(10*respd[0].pAco2)/10 +" mmHg</td></tr>";
	tableau += "<tr><td>P<small>E</small>CO₂:</td><td>" + Math.round(10*respd[0].pmeco2)/10 +" mmHg</td></tr>";
	tableau += '<tr><td>$\\frac{V_{EM}}{Vc}$ (Fowler):</td><td>' + Math.round(1000* respd[0].fowler)/10 +" %</td></tr>";
	tableau += '<tr><td>$\\frac{V_{EM}}{Vc}$ (Bohr):</td><td>' + Math.round(1000* respd[0].bohr)/10 +" %</td></tr>";
	tableau += "</table>";
	$(iddiv).append(tableau);
};

gs.unSurCent = function(v,i){
	if (i%10){
		return 0;
	}
	else{
		return 1;
	}
}

gs.graph = function(idsvg, conf) {

	this.idsvg = idsvg;
	this.margeG = 20;
	this.margeD = 20;
	this.margeH = 20;
	this.margeB = 50;

	this.padG = 0;
	this.padD = 0;
	this.padH = 0;
	this.padB = 0;

	this.padPlage = 5;
	
	this.durAnim = 1500;

	for(index in conf){
		this[index] = conf[index];
	}


	this.svg = d3.select(idsvg);

	this.animations = [];
	this.anotations = [];
	this.plages = [];
	this.curAnim = 0;

	this.width = this.svg.style("width");
	this.width = this.width.substr(0, this.width.length-2);

	this.height = this.svg.style("height");
	this.height = this.height.substr(0, this.height.length-2);

	this.defs = this.svg.append("defs");

	this.defs.append("marker")
		.attr("id", "flechep")
		.attr("refY", "7")
		.attr("refX", "7")
		.attr("markerWidth", "21")
		.attr("markerHeight", "14")
		.attr("orient", "auto")
		.attr("markerUnits", "userSpaceOnUse")
		.append("path")
		.attr("d", "M5,3 L9,7 L5,11");

	this.defs.append("marker")
		.attr("id", "fleches")
		.attr("refY", "7")
		.attr("refX", "14")
		.attr("markerWidth", "21")
		.attr("markerHeight", "14")
		.attr("orient", "auto")
		.attr("markerUnits", "userSpaceOnUse")
		.append("path")
		.attr("d", "M16,3 L12,7 L16,11");

	this.defs.append("marker")
		.attr("id", "flecheg")
		.attr("refY", "10")
		.attr("refX", "7")
		.attr("markerWidth", "21")
		.attr("markerHeight", "18")
		.attr("orient", "auto")
		.attr("markerUnits", "userSpaceOnUse")
		.append("path")
		.attr("d", "M3,5 L9,10 L3,15");

	this.setscale = function(d, fx, fy){
		this.ymin = Math.min(d3.min(d, fy),0);
		this.ymax = d3.max(d, fy);
		this.xmin = d3.min(d, fx);
		this.xmax = d3.max(d, fx);

		this.echellex = d3.scale.linear()
			.domain([this.xmin, this.xmax])
			.range([this.margeG + this.padG, this.width - (this.margeD + this.padD)]);

		this.echelley = d3.scale.linear()
			.domain([this.ymin, this.ymax])
			.range([this.height - (this.margeB + this.padB), this.margeH + this.padH]);

		return this;
	}

	this.getlf = function(d, fx, fy){

		this.lf = d3.svg.line()
			.x(function(d) {return this.echellex(fx(d))})
			.y(function(d) {return this.echelley(fy(d))})
			.interpolate("linear");
	}

	this.getsf = function(d, fx, fy){

		this.sf = d3.svg.area()
			.x(function(d) {return this.echellex(fx(d))})
			.y0(function(d) {return this.echelley(0)})
			.y1(function(d) {return this.echelley(fy(d))})
			.interpolate("linear");
	}


	this.tracer = function(donnees, fonctionx, fonctiony){
		this.donnees = donnees;
		var times = this.donnees.map(function(d){return d.Time});
		this.animTime = Math.max(...times) * 1000;

		this.getlf(donnees, fonctionx, fonctiony);
		this.getsf(donnees, fonctionx, fonctiony);
		var coord = this.lf(donnees, fonctionx, fonctiony);
		var surface = this.sf(donnees, fonctionx, fonctiony);
		
		this.drawGridY();
		this.drawGridX();
		if (this.ligneZeroX == true) {this.tracerZeroX();}

		this.clip = this.defs.append("clipPath")
			.attr("id", this.idsvg.replace("#","") + "clip");
		
		this.clipRect = this.clip.append("rect")
			.attr("x", this.margeG + this.padG)
			.attr("y", this.margeH + this.padH - 2)
			.attr("width", this.width - (this.margeD + this.margeG + this.padD + this.padG) + 2)
			.attr("height", this.height - (this.margeH + this.margeB + this.padH + this.padB) + 2)
			;

		this.surface = this.svg.append("path")
			.attr("d", surface)
			.attr("class", "surface")
			.style("clip-path", "url(" + this.idsvg + "clip)")
			;	

		this.axes()

		this.courbe = this.svg.append("path")
			.attr("d", coord)
			.style("clip-path", "url(" + this.idsvg + "clip)")
			;



		return this;
	}

	this.ajouter = function(donnees, fonctionx, fonctiony){
		this.donnees = donnees;

		this.getlf(donnees, fonctionx, fonctiony);
		var coord = this.lf(donnees, fonctionx, fonctiony);

		if (this.ligneZeroX == true) {this.tracerZeroX();}

		this.clip = this.defs.append("clipPath")
			.attr("id", this.idsvg + "clip");
		
		this.clipRect = this.clip.append("rect")
			.attr("x", this.margeG + this.padG)
			.attr("y", this.margeH + this.padH - 2)
			.attr("width", this.width - (this.margeD + this.margeG + this.padD + this.padG) + 2)
			.attr("height", this.height - (this.margeH + this.margeB + this.padH + this.padB));

		this.courbe2 = this.svg.append("path")
			.attr("d", coord)
			.style("clip-path", "url(#" + this.idsvg + "clip)")
			.style("opacity", 0);
		this.courbe2.transition().duration(this.durAnim).style("opacity", 1);
		this.anotations.push(this.courbe2);

		return this;
	}


	// To simulate continuous plotting like the one seen in medical ventilators,
	// we plot the entire time serie, hidden by a zero width clip rectangle, and then
	// gradually unhide it.
	
	this.animate = function(){
		this.clipRect.attr("width", 0);

		this.clipRect.transition().ease("linear").duration(this.animTime)
				.attr("width", this.width - (this.margeD + this.margeG + this.padD + this.padG) + 2);
		return this;
	}

	this.anotter = function(texte, x, y){
		var a = this.svg.append("text")
			.attr("x", this.echellex(x))
			.attr("y", this.echelley(y))
			.attr("text-anchor", "middle")
			.attr("dominant-baseline", "middle")
			.text(texte)
			.attr("class", "anottation")
			.style("opacity", "0");

		a.transition().duration(1500).style("opacity", "1");
		this.anotations.push(a);

		return this;
	}

	this.raz = function(){
		for(i in this.anotations){
			this.anotations[i].transition().duration(this.durAnim).style("opacity", 0);
			this.anotations[i].transition().delay(this.durAnim).remove();
		}
		for(i in this.plages){
			this.plages[i].ligne.transition().duration(this.durAnim).style("opacity", 0);
			this.plages[i].texte.transition().duration(this.durAnim).style("opacity", 0);
			this.plages[i].ligne.transition().delay(this.durAnim).remove();
			this.plages[i].texte.transition().delay(this.durAnim).remove();
		}
	}

	this.tracerZeroX = function(){
		this.ligneZeroX = this.svg.append("line")
			.attr("x1", this.echellex(this.xmin))
			.attr("x2", this.echellex(this.xmax))
			.attr("y1", this.echelley(0))
			.attr("y2", this.echelley(0))
			.attr("class", "ligneZero");
	}

	this.axes = function(){
		//if(this.hasOwnProperty("axex")){console.log("Axe X déja présent");}
		//else{
			this.axex = this.svg.append("line")
				.attr("x1", this.margeG)
				.attr("x2", this.width - this.margeD)
				//.attr("y1", this.height - this.margeB)
				//.attr("y2", this.height - this.margeB)
				.attr("y1", this.echelley(0))
				.attr("y2", this.echelley(0))
				.attr("class", "axe");

			this.axey = this.svg.append("line")
				//.attr("x1", this.margeG)
				//.attr("x2", this.margeG)
				.attr("x1", this.echellex(0))
				.attr("x2", this.echellex(0))
				.attr("y1", this.height - this.margeB)
				.attr("y2", this.margeH)
				.attr("class", "axe");

			d3.selectAll(".axe").attr("style", "marker-end: url(#flechep);");
		//}
	}

	this.zoomX = function(xmin, xmax) {

		this.echellex = d3.scale.linear()
			.domain([0, 3])
			.range([this.margeG + this.padG, this.width - (this.margeD + this.padD)]);
		
		this.getlf(this.donnees, this.fx, this.fy );
		
		this.courbe.transition().duration(this.durAnim)
			.attr("d", this.lf(this.donnees));
	}

	this.plagex = function(min, max, id){
		var durAnim = 1000;
		var pad = this.padPlage;
		var plage = {};
		plage.ligne = this.svg.append("line")
			.attr("x1", this.echellex(min) + pad)
			.attr("x2", this.echellex(min)+ pad + 6)
			//.attr("y1", this.height - (this.margeB - 15))
			//.attr("y2", this.height - (this.margeB - 15))
			.attr("y1", this.height - this.margeB/1.5)
			.attr("y2", this.height - this.margeB/1.5)
			.attr("class", "axe")
			.attr("style", "marker-start: url(#fleches);marker-end: url(#flechep);");
			plage.ligne.transition().duration(durAnim).attr("x2", this.echellex(max)- pad);

		plage.texte = this.svg.append("text")
			.attr("x", this.echellex(min + (max - min)/2))
			.attr("y", this.height - this.margeB/2 + 20)
			.attr("text-anchor", "middle")
			.text(id)
			.attr("opacity", 0)
		plage.texte.transition().duration(durAnim).attr("opacity",1);
		this.plages.push(plage);

	}

	this.setidx = function(texte){
		this.idx = this.svg.append("text")
			.attr("x", this.width - this.margeD)
			.attr("y", this.height - (.2 * this.margeB))
			.attr("text-anchor", "end")
			.text(texte);
		return this;
	}

	this.setidy = function(texte){
		var cx = this.margeG + 15;
		var cy = this.margeH + 10;
		this.idy = this.svg.append("text")
			.attr("y", cy)
			.attr("x", cx)
			.attr("text-anchor", "start")
			.text(texte)

		return this;
	}


	this.pointy = function(val, id){
		var ligne = this.svg.append("line")
			.attr("x1", this.margeG)
			.attr("x2", this.margeG)
			.attr("y1", this.echelley(val))
			.attr("y2", this.echelley(val))
			.attr("class", "help");
		ligne.transition().duration(this.durAnim).attr("x2", this.width - this.margeD);
		this.anotations.push(ligne);

		var texte = this.svg.append("text")
			.attr("x", this.margeG/2)
			.attr("y", this.echelley(val))
			.attr("dy", 8)
			.attr("text-anchor", "middle")
			.text(id);
		this.anotations.push(texte);
	}

	this.pointx = function(val, id){
		var an = this.svg.append("line")
			.attr("x1", this.echellex(val))
			.attr("x2", this.echellex(val))
			.attr("y1", this.echelley(this.ymax))
			.attr("y2", this.echelley(this.ymax))
			.attr("class", "help");
			an.transition().duration(this.durAnim).attr("y1", this.echelley(this.ymin) - 5);
		this.anotations.push(an);

		var an = this.svg.append("text")
			.attr("y", this.height - this.margeB/3)
			.attr("x", this.echellex(val))
			.attr("text-anchor", "middle")
			.text(id);
		this.anotations.push(an);
	}
	this.drawGridY = function(){

		this.gridY = d3.svg.axis()
			.orient("left")
			.tickSize(- (this.width - this.margeG - this.margeD))
			.scale(this.echelley);

		this.gridYGroup = this.svg.append("g")
			.attr("class", "gridY")
			.attr("transform", "translate(" + this.echellex(this.xmin) + ", 0)")
			.call(this.gridY)
			;

		return this;
	}

	this.drawGridX = function(){

		this.gridX = d3.svg.axis()
			.tickSize(- (this.height - this.margeH - this.margeB - this.padH))
			.scale(this.echellex);

		this.gridXGroup = this.svg.append("g")
			.attr("class", "gridX")
			.attr("transform", "translate(0, " + this.echelley(this.ymin) + ")")
			.call(this.gridX)
			;

		return this;
	}

	this.drawGradY = function(){

		this.gradY = d3.svg.axis()
			.tickSize(20)
			//.orient("left")
			.scale(this.echelley);

		this.gradYGroup = this.svg.append("g")
			.attr("class", "gradY")
			.attr("transform", "translate(" + this.echellex(this.xmin) + ", 0)")
			.call(this.gradY)
			;

		return this;
	}

	this.drawGradX = function(){

		this.gradX = d3.svg.axis()
			.scale(this.echellex);

		this.gradXGroup = this.svg.append("g")
			.attr("class", "gradX")
			.attr("transform", "translate(0, " + this.echelley(this.ymin) + ")")
			.call(this.gradX)
			;

		return this;
	}
	return this;
}

gs.quickGraph = function(div, data, fx, fy, conf){
	return gs.graph(div, conf)
		.setscale(data, fx, fy)
		.tracer(data, fx, fy);
}

gs.reiley = function(idsvg, d){
	this.svg = d3.select(idsvg);
	this.width = this.svg.style("width");
	this.width = this.width.substr(0, this.width.length-2);

	var padG = 70;
	var longBr = 150;
	var largBr = 40;
	var stroke = 3;
	var facteurVent = 20;
	var alvMin = 15;
	var alvdist = (this.width - 2 * padG)/(d.length -1);
	this.alvdist = alvdist;
	
	d3.select(idsvg).selectAll("rect.brExt")
			.data(d)
		.enter()
			.append("rect")
			.attr("x", function(d,i){return i * alvdist + padG - largBr/2})
			.attr("y", 0)
			.attr("width", largBr)
			.attr("height", longBr)
			.style("fill", "black");

	d3.select(idsvg).selectAll("circle.alvExt")
			.data(d)
		.enter()
			.append("circle")
			.attr("cx", function(d,i){return i * alvdist + padG})
			.attr("cy", longBr)
			.attr("r", function(d){return alvMin + facteurVent * d.ventilation})
			.style("fill", "black");

	d3.select(idsvg).selectAll("rect.brInt")
			.data(d)
		.enter()
			.append("rect")
			.attr("x", function(d,i){return i * alvdist + padG - largBr/2 + stroke})
			.attr("y", 0)
			.attr("width", largBr - 2 * stroke)
			.attr("height", longBr)
			.style("fill", "white");

	d3.select(idsvg).selectAll("circle.alvInt")
			.data(d)
		.enter()
			.append("circle")
			.attr("cx", function(d,i){return i * alvdist + padG})
			.attr("cy", longBr)
			.attr("r", function(d){return alvMin + facteurVent * d.ventilation - stroke})
			.style("fill", "white");

}

gs.randomHue = function(saturation, lightnes){
	var hue = Math.random() * 360;
	var color = "hsl( " + hue + ", " + saturation + "%, " + lightnes + "% )";
	return color;
}
gs.addGraph = function(target, data, fx, fy, conf){
	var numSVG = document.getElementsByTagName("svg").length + 1; 
	var newSVGid = target + "SVG" + numSVG;
	var newsvg = d3.select("#" + target)
		.append("svg")
		.attr("id", newSVGid);
	if (typeof conf.class != "undefined"){
		newsvg.attr("class", "gs " + conf.class);
	}
	else {
		newsvg.attr("class", "gs");
	}
	return gs.quickGraph("#" + newSVGid, data, fx, fy, conf);
}
