function Vector(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

Vector.prototype.add = function (vector) {
    return new Vector(this.x + vector.x, this.y + vector.y);
};

Vector.prototype.subtract = function (vector) {
    return new Vector(this.x - vector.x, this.y - vector.y);
};

Vector.prototype.multiply = function (vector) {
    return new Vector(this.x * vector.x, this.y * vector.y);
};

Vector.prototype.multiplyScalar = function (scalar) {
    return new Vector(this.x * scalar, this.y * scalar);
};

Vector.prototype.divide = function (vector) {
    return new Vector(this.x / vector.x, this.y / vector.y);
};

Vector.prototype.divideScalar = function (scalar) {
    return new Vector(this.x / scalar, this.y / scalar);
};

Vector.prototype.length = function () {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
};

Vector.prototype.normalize = function () {
    return this.divideScalar(this.length());
};

d3.selection.prototype.bringElementAsTopLayer = function () {
    return this.each(function () {
        this.parentNode.appendChild(this);
    });
};

d3.selection.prototype.pushElementAsBackLayer = function () {
    return this.each(function () {
        var firstChild = this.parentNode.firstChild;
        if (firstChild) {
            this.parentNode.insertBefore(this, firstChild);
        }
    })
};

class ForceGraph {

    constructor({
        nodesParam, // an iterable of node objects (typically [{id}, …])
        linksParam // an iterable of link objects (typically [{source, target}, …])
    }, {
        nodeIdFunc = d => d.id, // given d in nodes, returns a unique identifier (string)
        nodeGroupFunc, // given d in nodes, returns an (ordinal) value for color
        nodeGroupsParam, // an array of ordinal values representing the node groups
        addNodeLabelParam = false,
        nodeTitleFunc, // given d in nodes, a title string
        nodeLabelFunc, // given d in nodes, a label string
        addNodeIconParam = false,
        nodeIconFunc, // given d in nodes, a icon string
        nodeIconSizeParam = 2, // given d in nodes, a size int
        nodeIconColorParam = "white", // given d in nodes, a color string
        nodeFillParam = "currentColor", // node stroke fill (if not using a group color encoding)
        nodeStrokeParam = "#fff", // node stroke color
        nodeStrokeWidthParam = 1.5, // node stroke width, in pixels
        nodeStrokeOpacityParam = 1, // node stroke opacity
        nodeRadiusParam = 30, // node radius, in pixels
        nodeStrengthParam,
        addNodeMenuParam = false,
        nodeMenuParam,
        nodeMenuColorFunc = d => d.color,
        nodeMenuOpacityParam = 0.8,
        nodeMenuWidthFunc = d => d.width,
        nodeMenuIconFunc = d => d.icon,
        nodeMenuIconColorParam = 'white',
        nodeMenuIconSizeParam = 2, // given d in nodes, a size int
        nodeMenuTitleFunc = () => "",
        linkIdFunc = d => d.id, // given d in links, returns a unique identifier (string)
        linkSourceFunc = ({ source }) => source, // given d in links, returns a node identifier string
        linkTargetFunc = ({ target }) => target, // given d in links, returns a node identifier string
        addLinkLabelParam = false,
        linkLabelFunc, // given d in links, a label string
        linkTitleFunc, // given d in links, a title string
        linkLineLengthParam = 250, // link line length
        linkStrokeParam = "#999", // link stroke color
        linkStrokeOpacityParam = 0.6, // link stroke opacity
        linkStrokeWidthParam = 5, // given d in links, returns a stroke width in pixels
        linkStrokeLinecapParam = "round", // link stroke linecap
        linkStrengthParam,
        addLinkMenuParam = false,
        addLinkArrowParam = true,
        useCurvedLinksParam = true,
        linkMenuParam,
        linkMenuColorFunc = d => d.color,
        linkMenuOpacityParam = 0.8,
        linkMenuWidthFunc = d => d.width,
        linkMenuIconFunc = d => d.icon,
        linkMenuIconColorParam = 'white',
        linkMenuIconSizeParam = 2, // given d in nodes, a size int
        linkMenuTitleFunc = () => "",
        linkRadiusParam = 15, // link radius, in pixels
        colorsParam = d3.schemeTableau10, // an array of color strings, for the node groups
        widthParam, // outer width, in pixels
        heightParam, // outer height, in pixels
        invalidationParam, // when this promise resolves, stop the simulation
        containerIdParam,
        shortSimulationParam,
        addGraphGroupsKeysParam = true,
        allowZoomParam = true,
        allowDragParam = true,
        onMenuItemClickFunc = () => { }
    } = {}) {
        this.nodes = nodesParam;
        this.links = linksParam;
        this.nodeId = nodeIdFunc;
        this.nodeGroup = nodeGroupFunc;
        this.nodeGroups = nodeGroupsParam;
        this.addNodeLabel = addNodeLabelParam;
        this.nodeTitle = nodeTitleFunc;
        this.nodeLabel = nodeLabelFunc;
        this.addNodeIcon = addNodeIconParam;
        this.nodeIcon = nodeIconFunc;
        this.nodeIconSize = nodeIconSizeParam;
        this.nodeIconColor = nodeIconColorParam;
        this.nodeFill = nodeFillParam;
        this.nodeStroke = nodeStrokeParam;
        this.nodeStrokeWidth = nodeStrokeWidthParam;
        this.nodeStrokeOpacity = nodeStrokeOpacityParam;
        this.nodeRadius = nodeRadiusParam;
        this.nodeStrength = nodeStrengthParam;
        this.addNodeMenu = addNodeMenuParam;
        this.nodeMenu = nodeMenuParam;
        this.nodeMenuColor = nodeMenuColorFunc;
        this.nodeMenuOpacity = nodeMenuOpacityParam;
        this.nodeMenuWidth = nodeMenuWidthFunc;
        this.nodeMenuIcon = nodeMenuIconFunc;
        this.nodeMenuIconColor = nodeMenuIconColorParam;
        this.nodeMenuIconSize = nodeMenuIconSizeParam;
        this.nodeMenuTitle = nodeMenuTitleFunc;
        this.linkId = linkIdFunc;
        this.linkSource = linkSourceFunc;
        this.linkTarget = linkTargetFunc;
        this.addLinkLabel = addLinkLabelParam;
        this.linkLabel = linkLabelFunc;
        this.linkTitle = linkTitleFunc;
        this.linkLineLength = linkLineLengthParam;
        this.linkStroke = linkStrokeParam;
        this.linkStrokeOpacity = linkStrokeOpacityParam;
        this.linkStrokeWidth = linkStrokeWidthParam;
        this.linkStrokeLinecap = linkStrokeLinecapParam;
        this.linkStrength = linkStrengthParam;
        this.linkRadius = linkRadiusParam;
        this.addLinkMenu = addLinkMenuParam;
        this.addLinkArrow = addLinkArrowParam;
        this.useCurvedLinks = useCurvedLinksParam;
        this.linkMenu = linkMenuParam;
        this.linkMenuColor = linkMenuColorFunc;
        this.linkMenuOpacity = linkMenuOpacityParam;
        this.linkMenuWidth = linkMenuWidthFunc;
        this.linkMenuIcon = linkMenuIconFunc;
        this.linkMenuIconColor = linkMenuIconColorParam;
        this.linkMenuIconSize = linkMenuIconSizeParam;
        this.linkMenuTitle = linkMenuTitleFunc;
        this.colors = colorsParam;
        this.width = widthParam;
        this.height = heightParam;
        this.invalidation = invalidationParam;
        this.containerId = containerIdParam;
        this.onMenuItemClick = onMenuItemClickFunc;
        this.shortSimulation = shortSimulationParam;
        this.addGraphGroupsKeys = addGraphGroupsKeysParam;
        this.allowDrag = allowDragParam;
        this.allowZoom = allowZoomParam;

        if (this.width === undefined)
            this.width = $('#' + this.containerId).width()
        if (this.height === undefined)
            this.height = $('#' + this.containerId).height()

        // Compute values.
        this.NODES = d3.map(this.nodes, this.nodeId).map(this.intern);
        if (this.nodeTitle === undefined) this.nodeTitle = (_, i) => this.NODES[i];
        this.NODES_TITLES = this.nodeTitle == null ? null : d3.map(this.nodes, this.nodeTitle);
        if (this.nodeLabel === undefined) this.nodeLabel = (_, i) => this.NODES[i];
        this.NODES_LABELS = this.nodeLabel == null ? null : d3.map(this.nodes, this.nodeLabel);
        if (this.nodeIcon === undefined) this.nodeIcon = (_, i) => "";
        this.NODES_ICONS = this.nodeIcon == null ? null : d3.map(this.nodes, this.nodeIcon);
        this.NODES_GROUPS = this.nodeGroup == null ? null : d3.map(this.nodes, this.nodeGroup).map(this.intern);

        this.LINKS = d3.map(this.links, this.linkId).map(this.intern);
        this.LINKS_SOURCES = d3.map(this.links, this.linkSource).map(this.intern);
        this.LINKS_TARGETS = d3.map(this.links, this.linkTarget).map(this.intern);
        this.LINKS_STROKE_WIDTH = typeof this.linkStrokeWidth !== "function" ? null : d3.map(this.links, this.linkStrokeWidth);
        if (this.linkTitle === undefined) this.linkTitle = (_, i) => this.LINKS[i];
        this.LINKS_TITLES = this.linkTitle == null ? null : d3.map(this.links, this.linkTitle);
        if (this.linkLabel === undefined) this.linkLabel = (_, i) => this.LINKS[i];
        this.LINKS_LABELS = this.linkLabel == null ? null : d3.map(this.links, this.linkLabel);

        // Replace the input nodes and links with mutable objects for the simulation.
        this.nodes = d3.map(this.nodes, (_, i) => ({ id: this.NODES[i] }));
        this.links = d3.map(this.links, (_, i) => ({ id: this.LINKS[i], source: this.LINKS_SOURCES[i], target: this.LINKS_TARGETS[i] }));
        
        for (var i=0; i<this.links.length; i++) {
            let tlinks = this.links.filter(x => x.source == this.links[i].source && x.target == this.links[i].target).map(x => x.id);
            this.links[i].countInSameDirection = tlinks.length;
            this.links[i].indexInSameDirection = tlinks.indexOf(this.links[i].id)
            this.links[i].direction = (this.NODES.indexOf(this.links[i].source) < this.NODES.indexOf(this.links[i].target)) ? 0 : 1;
        }

        // Compute default domains.
        if (this.NODES_GROUPS && this.nodeGroups === undefined) this.nodeGroups = d3.sort(this.NODES_GROUPS);

        // Construct the scales.
        let color = this.nodeGroup == null ? null : d3.scaleOrdinal(this.nodeGroups, this.colors);

        // Construct the forces.
        this.forceNode = d3.forceManyBody();
        this.forceLink = d3.forceLink(this.links).distance(d => this.linkLineLength).id((e, i) => this.NODES[i]);
        if (this.nodeStrength !== undefined) this.forceNode.strength(this.nodeStrength);
        if (this.linkStrength !== undefined) this.forceLink.strength(this.linkStrength);

        let _this = this;

        this.svg = d3.select("#" + this.containerId)
            .append('svg')
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("viewBox", [-this.width / 2, -this.height / 2, this.width, this.height])
            .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

        
        if (this.addLinkArrow)
            this.svg.append("svg:defs").selectAll("marker")
                .data(["end"])      // Different link/path types can be defined here
                .enter().append("svg:marker")    // This section adds in the arrows
                .attr("id", String)
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 0)
                .attr("refY", 0)
                .attr("markerWidth", 2)
                .attr("markerHeight", 2)
                .attr("orient", "auto")
                .attr('fill', "#545454")
                .attr('opacity', 0.8)
                .append("svg:path")
                .attr("d", "M0,-5L10,0L0,5");

        if (this.addNodeMenu || this.addLinkMenu)
            this.svg.on('click', (e) => {
                d3.select('#' + _this.containerId).selectAll('.menu-arc').remove()
                d3.select('#' + _this.containerId).selectAll('.menu-arc-icon').remove()
            });


        this.link = this.svg.append("g")
            .selectAll("g")
            .attr("stroke", this.linkStroke)
            .attr("stroke-opacity", this.linkStrokeOpacity)
            .attr("stroke-width", typeof this.linkStrokeWidth !== "function" ? this.linkStrokeWidth : null)
            .attr("stroke-linecap", this.linkStrokeLinecap)
            .data(this.links)
            .join("g")
            .attr("id", (e, i) => "link_" + this.LINKS[i])
            .attr("class", "gobject glink")
            .attr("marker-end", "url(#end)");

        if (this.LINKS != null && this.LINKS.length > 0) {
            if (this.useCurvedLinks){
                this.link.append("path")
                    .attr("id", (e, i) => "link_path_" + this.LINKS[i])
                    .attr('class', 'link-line')
                    .attr('fill', 'transparent')
                    .attr("stroke-width", typeof this.linkStrokeWidth !== "function" ? this.linkStrokeWidth : null)
                    .attr("stroke-linecap", this.linkStrokeLinecap)
                    .attr("stroke", this.linkStroke)
                    .attr("style", "pointer-events:visiblestroke")
            }else{
                this.link.append("line")
                    .attr('class', 'link-line')
                    .attr("stroke", this.linkStroke)
                    .attr("fill", 'none')
                    .attr("stroke-opacity", this.linkStrokeOpacity)
                    .attr("stroke-width", typeof this.linkStrokeWidth !== "function" ? this.linkStrokeWidth : null)
                    .attr("stroke-linecap", this.linkStrokeLinecap)
                    .attr("style", "pointer-events:visiblestroke")
            }

            if (this.addLinkLabel) {
                this.link.append("circle")
                    .attr('class', 'link-circle')
                    .attr('fill', "#545454")
                    .attr('opacity', 0.8)
                    .attr("r", this.linkRadius)
                    .on('click', d => this.createMenu(d, true));

                this.link.append('text')
                    .attr('font-family', () => icon_font_family("bi-link-45deg"))
                    .attr('font-size', () => alter_icon_font_size("bi-link-45deg", this.nodeIconSize / 1.5) + 'em')
                    .attr('font-weight', 'bold')
                    .attr('fill', "white")
                    .attr('text-anchor', 'middle')
                    .attr('dominant-baseline', 'central')
                    .attr('class', 'link-icon')
                    .attr("style", "cursor: pointer;")
                    .text(() => icon_to_unicode("bi-link-45deg"))
                    .on('click', d => this.createMenu(d, true));

                this.link.append("text")
                    .attr('text-anchor', 'middle')
                    .attr('dominant-baseline', 'central')
                    .text((e, i) => this.LINKS_LABELS[i])
                    .attr('class', 'link-label')
                    .attr("fill", "#545454")
                    .attr("transform", "translate(0," + ((this.linkRadius * 2) / 1.2) + ")")
            }

            this.link.on("mouseover", function () {
                d3.select(this).bringElementAsTopLayer();
            });

            if (this.LINKS_STROKE_WIDTH) this.link.attr("stroke-width", (e, i) => this.LINKS_STROKE_WIDTH[i]);
            if (this.LINKS_TITLES) this.link.append("title").text((e, i) => this.LINKS_TITLES[i]);
        }

        this.node = this.svg.append("g")
            .selectAll("g")
            .attr("fill", this.nodeFill)
            .attr("style", "cursor: pointer;")
            .attr("stroke", this.nodeStroke)
            .attr("stroke-opacity", this.nodeStrokeOpacity)
            .attr("stroke-width", this.nodeStrokeWidth)
            .data(this.nodes)
            .join("g")
            .attr("id", (e, i) => "node_" + this.NODES[i])
            .attr("class", "gobject gnode");

        this.node.append("circle")
            .attr("style", "cursor: pointer;")
            .attr("fill", (e, i) => color(this.NODES_GROUPS[i]))
            .attr("r", this.nodeRadius)
            .on('click', d => this.createMenu(d));

        if (this.addNodeIcon)
            this.node.append('text')
                .attr('font-family', (e, i) => icon_font_family(this.NODES_ICONS[i]))
                .attr('font-size', (e, i) => alter_icon_font_size(this.NODES_ICONS[i], this.nodeIconSize) + 'em')
                .attr('fill', d => this.nodeIconColor)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'central')
                .attr('class', 'node-icon')
                .attr("style", "cursor: pointer;")
                .text((e, i) => icon_to_unicode(this.NODES_ICONS[i]))
                .on('click', d => this.createMenu(d));

        if (this.addNodeLabel)
            this.node.append("text")
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'hanging')
                .text((e, i) => this.NODES_LABELS[i])
                .attr('class', 'node-label')
                .attr("fill", (e, i) => color(this.NODES_GROUPS[i]))
                .attr("transform", "translate(0," + this.nodeRadius + ")")


        this.node.on("mouseover", function () {
            d3.select(this).bringElementAsTopLayer();
        });

        if (this.allowDrag)
            this.node.call(this.drag().bind(this));

        if (this.NODES_GROUPS) this.node.attr("fill", (e, i) => color(this.NODES_GROUPS[i]));
        if (this.NODES_TITLES) this.node.append("title").text((e, i) => this.NODES_TITLES[i]);

        // Handle invalidation.
        if (this.invalidation != null) this.invalidation.then(() => this.simulation.stop());

        if (this.addGraphGroupsKeys) {
            const key = this.svg.append("g")
                .attr("class", "no-zoom")
                .selectAll("g")
                .data(this.NODES_GROUPS)
                .join("g")
                .attr("class", "no-zoom")

            key.append("circle")
                .attr("fill", (i, j) => color(this.NODES_GROUPS[j]))
                .attr("cx", (i, j) => (this.svg.attr("width") / 2) - 20)
                .attr("cy", (i, j) => (-1 * (this.svg.attr("height") / 2) + 20 + (j * 30)))
                .attr("r", 10)

            key.append("text")
                .text((i, j) => this.NODES_GROUPS[j])
                .attr("fill", (i, j) => color(this.NODES_GROUPS[j]))
                .attr("x", (i, j) => (this.svg.attr("width") / 2) - 40)
                .attr("y", (i, j) => (-1 * (this.svg.attr("height") / 2) + 25 + (j * 30)))
        }

        if (this.allowZoom) {
            this.zoom = d3.zoom().on('zoom', this.handleZoom.bind(this));
            this.zoom_elemt = d3.select('#' + _this.containerId).select('svg').call(this.zoom);

            let zoomControls = this.svg.append('g')
                                       .attr('class','no-zoom')

            zoomControls.append("rect")
                        .attr('class','no-zoom')
                        .attr("width", 20)
                        .attr("height", 20)
                        .attr("rx", 4)
                        .attr("x", (i, j) => (this.svg.attr("width") / 2) - 30)
                        .attr("y", (i, j) => ((this.svg.attr("height") / 2) - 100))
                        .style("fill", 'white')
                        .style("stroke", 'gray')
                        .on('click', this.zoomIn.bind(this));

            zoomControls.append("rect")
                        .attr('class','no-zoom')
                        .attr("width", 20)
                        .attr("height", 20)
                        .attr("rx", 4)
                        .attr("x", (i, j) => (this.svg.attr("width") / 2) - 30)
                        .attr("y", (i, j) => ((this.svg.attr("height") / 2) - 70))
                        .style("fill", 'white')
                        .style("stroke", 'gray')
                        .on('click', this.zoomOut.bind(this));

            zoomControls.append("rect")
                        .attr('class','no-zoom')
                        .attr("width", 20)
                        .attr("height", 20)
                        .attr("rx", 4)
                        .attr("x", (i, j) => (this.svg.attr("width") / 2) - 30)
                        .attr("y", (i, j) => ((this.svg.attr("height") / 2) - 40))
                        .style("fill", 'white')
                        .style("stroke", 'gray')
                        .on('click', this.resetZoom.bind(this));

            zoomControls.append('text')
                        .text('+')
                        .attr('class','no-zoom')
                        .attr('font-family','FontAwesome')
                        .attr('font-size', '1em')
                        .attr('text-anchor', 'middle')
                        .attr("x", (i, j) => (this.svg.attr("width") / 2) - 20)
                        .attr("y", (i, j) => ((this.svg.attr("height") / 2) - 90))
                        .attr('dominant-baseline', 'central')
                        .attr('fill','gray')
                        .attr("style", "cursor: pointer;")
                        .on('click', this.zoomIn.bind(this));

            zoomControls.append('text')
                        .text('_')
                        .attr('class','no-zoom')
                        .attr('font-family','FontAwesome')
                        .attr('font-size', '1em')
                        .attr('font-weight', 'bold')
                        .attr('stroke','gray')
                        .attr('text-anchor', 'middle')
                        .attr("x", (i, j) => (this.svg.attr("width") / 2) - 20)
                        .attr("y", (i, j) => ((this.svg.attr("height") / 2) - 67))
                        .attr('dominant-baseline', 'central')
                        .attr('fill','gray')
                        .attr("style", "cursor: pointer;")
                        .on('click', this.zoomOut.bind(this));

            zoomControls.append('text')
                        .text('⊙')
                        .attr('class','no-zoom')
                        .attr('font-family','FontAwesome')
                        .attr('font-size', '1em')
                        .attr('text-anchor', 'middle')
                        .attr("x", (i, j) => (this.svg.attr("width") / 2) - 20)
                        .attr("y", (i, j) => ((this.svg.attr("height") / 2) - 31))
                        .attr('dominant-baseline', 'central')
                        .attr('fill','gray')
                        .attr("style", "cursor: pointer;")
                        .on('click', this.resetZoom.bind(this));
        }
        
        d3.select("#" + this.containerId)
          .selectAll(".link-line,.link-circle,.link-icon")
          .on("mouseover", function (d) {
            d3.select($(this.parentElement).children('.link-line')[0]).attr("stroke", "#60c5fb");
            d3.select($(this.parentElement).children('.link-circle')[0]).attr("fill", "#60c5fb");
          }).on("mouseout", function (d) {
            d3.select($(this.parentElement).children('.link-line')[0]).attr("stroke", _this.linkStroke);
            d3.select($(this.parentElement).children('.link-circle')[0]).attr("fill", "#545454");
          })

        this.simulation = d3.forceSimulation(this.nodes)
            .force("link", this.forceLink)
            .force("charge", this.forceNode)
            .force("x", d3.forceX())
            .force("y", d3.forceY())
            .on("tick", this.ticked.bind(this));

        Object.assign(this.svg.node(), { scales: { color } });
    }

    // x: x-coordinate
    // y: y-coordinate
    // w: width
    // h: height
    // r: corner radius
    // tl: top_left rounded?
    // tr: top_right rounded?
    // bl: bottom_left rounded?
    // br: bottom_right rounded?

    rounded_rect_d(x, y, w, h, r, tl, tr, bl, br) {
        var retval;
        retval  = "M" + (x + r) + "," + y;
        retval += "h" + (w - 2*r);
        if (tr) { retval += "a" + r + "," + r + " 0 0 1 " + r + "," + r; }
        else { retval += "h" + r; retval += "v" + r; }
        retval += "v" + (h - 2*r);
        if (br) { retval += "a" + r + "," + r + " 0 0 1 " + -r + "," + r; }
        else { retval += "v" + r; retval += "h" + -r; }
        retval += "h" + (2*r - w);
        if (bl) { retval += "a" + r + "," + r + " 0 0 1 " + -r + "," + -r; }
        else { retval += "h" + -r; retval += "v" + -r; }
        retval += "v" + (2*r - h);
        if (tl) { retval += "a" + r + "," + r + " 0 0 1 " + r + "," + -r; }
        else { retval += "v" + -r; retval += "h" + r; }
        retval += "z";
        return retval;
    }

    destroy() {
        this.simulation.stop()
        d3.select('#' + this.containerId).selectAll("g > *").remove();
        $('#' + this.containerId).empty()
    }

    createMenu(pointer, forLink = false) {
        if (!forLink && !this.addNodeMenu)
            return

        if (forLink && !this.addLinkMenu)
            return

        let _this = this;
        let nodePie = d3.pie()
            .value(_this.nodeMenuWidth)
            .padAngle(0.0349066) // 2 degrees in radian
            .sort(null)
            .value(_this.nodeMenuWidth)

        let linkPie = d3.pie()
            .value(_this.linkMenuWidth)
            .padAngle(0.0649066) // 2 degrees in radian
            .sort(null)
            .value(_this.linkMenuWidth)

        let nodeArcGenerator = d3.arc()
            .innerRadius(_this.nodeRadius * 1.2)
            .outerRadius(_this.nodeRadius * 2.3)

        let linkArcGenerator = d3.arc()
            .innerRadius(_this.linkRadius * 1.2)
            .outerRadius(_this.linkRadius * 2.7)

        let gId = "#link_" + pointer.currentTarget.__data__['id']
        let pie = linkPie
        let arcGenerator = linkArcGenerator
        let menu = _this.linkMenu
        let menuColor = _this.linkMenuColor
        let menuOpacity = _this.linkMenuOpacity
        let menuIcon = _this.linkMenuIcon
        let menuIconColor = _this.linkMenuIconColor
        let menuIconSize = _this.linkMenuIconColor
        let menuTitle = _this.linkMenuTitle

        if (!forLink) {
            gId = "#node_" + pointer.currentTarget.__data__['id']
            pie = nodePie
            arcGenerator = nodeArcGenerator
            menu = _this.nodeMenu
            menuColor = _this.nodeMenuColor
            menuOpacity = _this.nodeMenuOpacity
            menuIcon = _this.nodeMenuIcon
            menuIconColor = _this.nodeMenuIconColor
            menuIconSize = _this.nodeMenuIconSize
            menuTitle = _this.nodeMenuTitle
        }

        d3.select('#' + _this.containerId).selectAll('.menu-arc').remove()
        d3.select('#' + _this.containerId).selectAll('.menu-arc-icon').remove()

        let nd = d3.select('#' + _this.containerId).select(gId)
        nd = nd.selectAll('g')
            .data(pie(menu))
            .enter();

        let g_p = nd.append('g')
            .attr("style", "cursor: pointer;")
            .attr('class', 'menu-arc')

        let path = g_p.append('path')
            .attr("id", (e, i) => "menu-arc-path_" + i)
            .attr('d', arcGenerator)
            .attr("style", "cursor: pointer;")
            .attr('fill', menuColor)
            .attr("opacity", menuOpacity)
            .attr("class", 'mi')
            .on('click', (event, chosenArc) => {
                let gobj = event.currentTarget.closest('.gobject')
                d3.select('#' + _this.containerId).selectAll('.menu-arc').remove()
                d3.select('#' + _this.containerId).selectAll('.menu-arc-icon').remove()
                _this.onMenuItemClick(gobj.id, chosenArc.data.id, $(gobj).hasClass('gnode'));
                event.stopPropagation();
            })

        path.append("title").text((e, i) => menuTitle(menu[i]))

        if(forLink){
            path.on("mouseover", function (d) {
                d3.select(this).style("opacity", 0.8);
                d3.select(this).attr("fill", "#60c5fb");
            }).on("mouseout", function (d) {
                d3.select(this).style("opacity", menuOpacity);
                d3.select(this).attr("fill", _this.linkMenuColor);
            })
        }else{
            path.on("mouseover", function (d) {
                d3.select(this).style("opacity", menuOpacity - 0.1);
            }).on("mouseout", function (d) {
                d3.select(this).style("opacity", menuOpacity);
            })
        }
       

        let menuarcicon = g_p.append('text')
            .attr("transform", d => `translate(${arcGenerator.centroid(d)})`)
            .attr("id", (e, i) => "menu-arc-icon_" + i)
            .attr('font-family', (e, i) => icon_font_family(menuIcon(menu[i])))
            .attr('font-size', (e, i) => alter_icon_font_size(menuIcon(menu[i]), menuIconSize) + 'em')
            .attr('fill', menuIconColor)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('class', 'menu-arc-icon')
            .attr("style", "cursor: pointer;")
            .on('click', (event) => {
                d3.select('#' + $(event.currentTarget).siblings('.mi').attr('id')).dispatch('click')
                event.stopPropagation()
            })
            .text((e, i) => icon_to_unicode(menuIcon(menu[i])))
            
        menuarcicon.append("title").text((e, i) => menuTitle(menu[i]));
            
        if(forLink){
            menuarcicon.on("mouseover", function (d) {
                d3.select($(this.parentElement).children('.mi')[0]).style("opacity", 0.8);
                d3.select($(this.parentElement).children('.mi')[0]).attr("fill", "#60c5fb");
            }).on("mouseout", function (d) {
                d3.select($(this.parentElement).children('.mi')[0]).style("opacity", menuOpacity);
                d3.select($(this.parentElement).children('.mi')[0]).attr("fill", _this.linkMenuColor);
            })
        }

        if (_this.addLinkMenu)
            if (_this.useCurvedLinks)
                _this.link.each(function it(d) {
                    d3.select('#' + _this.containerId).select("#link_" + d['id']).selectAll('.menu-arc')
                        .attr('transform', () => 'translate(' + _this.calcLinkLabelPosition(d).x
                            + ', ' + _this.calcLinkLabelPosition(d).y + ')')
                })
            else
                _this.link.each(function it(d) {
                    d3.select('#' + _this.containerId).select("#link_" + d['id']).selectAll('.menu-arc')
                        .attr('transform', () => 'translate(' + _this.calcLinkLineCenter(d).x
                            + ', ' + _this.calcLinkLineCenter(d).y + ')')
                })

        pointer.stopPropagation();
        pointer.preventDefault();
    }

    handleZoom(e) {
        d3.select('#' + this.containerId).selectAll('.menu-arc').remove()
        d3.select('#' + this.containerId).selectAll('.menu-arc-icon').remove()
        d3.select('#' + this.containerId).selectAll('svg g')
            .filter(function () {
                return !this.classList.contains('no-zoom')
            })
            .attr('transform', e.transform);
    }

    zoomIn(){
        this.zoom.scaleBy(this.svg.transition().duration(750), 1.2);
    }

    zoomOut(){
        this.zoom.scaleBy(this.svg.transition().duration(750), 0.8);
    }

    resetZoom(){
        this.zoom_elemt.transition().duration(750).call(this.zoom.transform, d3.zoomIdentity);
    }

    intern(value) {
        return value !== null && typeof value === "object" ? value.valueOf() : value;
    }

    ticked() {
        let _this = this;
        if (_this.useCurvedLinks)
            _this.link.each(function it(d) {
                d3.select('#' + _this.containerId).selectAll(".link-line")
                    .attr("d", d =>{
                        if (d.source.id == d.target.id) {
                            var x1 = d.source.x,
                                y1 = d.source.y,
                                x2 = d.target.x,
                                y2 = d.target.y,
                                dx = x2 - x1,
                                dy = y2 - y1,
                                dr = Math.sqrt(dx * dx + dy * dy),
                                // Defaults for normal edge.
                                drx = dr,
                                dry = dr,
                                xRotation = 0, // degrees
                                largeArc = 0, // 1 or 0
                                sweep = 1; // 1 or 0
                            // Self edge.
                            if (x1 === x2 && y1 === y2) {
                                // Fiddle with this angle to get loop oriented.
                                xRotation = -45;
                                // Needs to be 1.
                                largeArc = 1;
                                // Change sweep to change orientation of loop. 
                                //sweep = 0;
                                // Make drx and dry different to get an ellipse
                                // instead of a circle.
                                drx = 30;
                                dry = 20;
                                // For whatever reason the arc collapses to a point if the beginning
                                // and ending points of the arc are the same, so kludge it.
                                x2 = x2 + 1;
                                y2 = y2 + 1;
                            }
                            return "M" + x1 + "," + y1 + "A" + drx + "," + dry + " " + xRotation + "," + largeArc + "," + sweep + " " + x2 + "," + y2;
                        } else {
                            let startpoint = _this.calcLinkStart(d)
                            let endpoint = _this.calcLinkEnd(d)
                            let dx = endpoint.x - startpoint.x
                            let dy = endpoint.y - startpoint.y
                            let dr = Math.sqrt(dx * dx + dy * dy);
                            let angleAndside = "A" + dr + "," + dr + " 0 0,0" + " "
                            return "M" + startpoint.x + "," + startpoint.y + angleAndside + endpoint.x + "," + endpoint.y;
                        }
                    })
            })
        else
            _this.link.select(".link-line")
                .attr("x1", d => _this.calcLinkStart(d).x)
                .attr("y1", d => _this.calcLinkStart(d).y)
                .attr("x2", d => _this.calcLinkEnd(d).x)
                .attr("y2", d => _this.calcLinkEnd(d).y);

        if (_this.addLinkLabel) {
            _this.link.select(".link-label")
                .attr("x", d => _this.calcPositionOfLinkItems(d).x)
                .attr("y", d => _this.calcPositionOfLinkItems(d).y);

            _this.link.select("circle")
                .attr("cx", d => _this.calcPositionOfLinkItems(d).x)
                .attr("cy", d => _this.calcPositionOfLinkItems(d).y);

            _this.link.select(".link-icon")
                .attr("x", d => _this.calcPositionOfLinkItems(d).x)
                .attr("y", d => _this.calcPositionOfLinkItems(d).y);
        }

        if (_this.addLinkMenu)
            _this.link.each(function it(d) {
                d3.select('#' + _this.containerId).select("#link_" + d['id']).selectAll('.menu-arc')
                    .attr('transform', () => {
                        let pos = _this.calcPositionOfLinkItems(d);
                        return 'translate(' + pos.x + ', ' + pos.y + ')'
                    })
            })

        _this.node.select("circle")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        if (_this.addNodeMenu)
            _this.node.each(function it(d) {
                d3.select('#' + _this.containerId).select("#node_" + d['id']).selectAll('.menu-arc')
                    .attr('transform', () => 'translate(' + d.x + ', ' + d.y + ')')
            })

        if (_this.addNodeIcon)
            _this.node
                .select(".node-icon")
                .attr("x", d => d.x)
                .attr("y", d => d.y);

        if (_this.addNodeLabel)
            _this.node
                .select(".node-label")
                .attr("x", d => d.x)
                .attr("y", d => d.y);

        if (_this.shortSimulation) _this.simulation.alphaTarget(0);
    }

    calcLinkStart(d) {
        return new Vector(d.source.x,d.source.y)
    }

    calcLinkEnd(d) {
        if (!this.addLinkArrow) return new Vector(d.target.x, d.target.y);

        let ip =  this.findIntersectionPoint(new Vector(d.target.x, d.target.y), this.nodeRadius * 1.7, new Vector(d.source.x, d.source.y));
        let tp = this.findTangentPoints(new Vector(d.target.x, d.target.y), this.nodeRadius * 1.7, new Vector(d.source.x, d.source.y))[1];
        let mp = new Vector((ip.x + tp.x)/2, (ip.y + tp.y)/2)
        return mp;
    }

    calcPositionOfLinkItems(d){
        if(this.useCurvedLinks){
            return this.calcLinkLabelPosition(d)
        }else{
            return this.calcLinkLineCenter(d)
        }
    }

    calcLinkLineCenter(d) {
        let ls = this.calcLinkStart(d);
        let le = this.calcLinkEnd(d);
        x1 = ls.x
        x2 = le.x
        y1 = ls.y
        y2 = le.y
        return new Vector(Math.min(x1, x2) + ((Math.max(x1, x2) - Math.min(x1, x2)) / 2), Math.min(y1, y2) + ((Math.max(y1, y2) - Math.min(y1, y2)) / 2));
    }

    calcLinkPathCenter(d) {
        var pathEl = d3.select('#' + this.containerId).select("#link_path_" + d['id']).node()
        try {
            let pt = pathEl.getPointAtLength(pathEl.getTotalLength() / 2);
            return new Vector(pt.x,pt.y);
        } catch (error) {
            return new Vector(0,0);
        }
    }

    calcLinkLabelPosition(d) {
        var pathEl = d3.select('#' + this.containerId).select("#link_path_" + d['id']).node()
        try {
            let pt = pathEl.getPointAtLength((pathEl.getTotalLength() / 2) + this.nodeRadius/2);
            if(d.countInSameDirection>1){
                let margin = this.linkRadius + ((d.indexInSameDirection==0 || d.indexInSameDirection==1) ? 0 : 3);
                let pos = (pathEl.getTotalLength() / 2) + ((d.indexInSameDirection%2==0?-1:1) * (d.indexInSameDirection==0?1:(d.indexInSameDirection+1)) * margin)
                pos += this.nodeRadius/2;
                if(pos<0)
                    pos = 0
                if(pos>pathEl.getTotalLength())
                    pos = pathEl.getPointAtLength()

                pt = pathEl.getPointAtLength(pos);
            }
            return new Vector(pt.x,pt.y);
        } catch (error) {
            return new Vector(0,0);
        }
    }

    drag() {
        let _this = this;
        function dragstarted(event) {
            if (!event.active) _this.simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) _this.simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }


    findIntersectionPoint(origin, radius, otherLineEndPoint) {
        let v = otherLineEndPoint.subtract(origin);
        let lineLength = v.length();
        if (lineLength === 0) throw new Error("Length has to be positive");
        v = v.normalize();
        return origin.add(v.multiplyScalar(radius));
    }

    findTangentPoints(origin, radius, otherLineEndPoint) {
        let dx = origin.x - otherLineEndPoint.x;
        let dy = origin.y - otherLineEndPoint.y;
        let dd = Math.sqrt(dx * dx + dy * dy);
        let a = Math.asin(radius / dd);
        let b = Math.atan2(dy, dx);

        let t1 = b - a
        let ta = new Vector(origin.x + (radius * Math.sin(t1)), origin.y + (radius * -Math.cos(t1)));

        let t2 = b + a
        let tb = new Vector(origin.x + (radius * -Math.sin(t2)), origin.y + (radius * Math.cos(t2)));

        return [ta,tb];
    }
}

function icon_to_unicode(icon_class) {
    if (icon_class == null || icon_class === undefined || icon_class.trim().length == 0)
        return ""

    if (icon_class.trim().startsWith("bi"))
        return getFontClassUnicode(icon_class);
    else if (icon_class.trim().startsWith("fa") && icon_class.trim().includes(" ")) {
        return getFontClassUnicode(icon_class.trim());
    }

    return ""
}

function getFontClassUnicode(name) {'use strict';
  // Create a holding element (they tend to use <i>, so let's do that)
  const testI = document.createElement('i');
  // Create a realistic classname
  // - maybe one day it will need both, so let's add them
  testI.className = name;
  // We need to append it to the body for it to have
  //   its pseudo element created
  document.body.appendChild(testI);

  // Get the computed style
  const char = window.getComputedStyle(
    testI, ':before' // Add the ':before' to get the pseudo element
  ).content.replace(/'|"/g, ''); // content wraps things in quotes
                                 //   which we don't want
  // Remove the test element
  testI.remove();

  return char;
}

function icon_font_family(icon_class) {
    if (icon_class == null || icon_class === undefined || icon_class.trim().length == 0)
        return ""

    if (icon_class.trim().startsWith("bi"))
        return "bootstrap-icons"
    else if (icon_class.trim().startsWith("fa"))
        return "FontAwesome"

    return ""
}

function alter_icon_font_size(icon_class, size) {
    if (icon_class == null || icon_class === undefined || icon_class.trim().length == 0)
        return size

    if (icon_class.trim().startsWith("bi"))
        return size
    else if (icon_class.trim().startsWith("fa"))
        return size * 8 / 10

    return size
}

function try_get(object, key, default_value) {
    var result = object[key.trim()];
    return (typeof result !== "undefined") ? result : default_value;
}