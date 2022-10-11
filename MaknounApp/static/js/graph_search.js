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

            this.pathPointerEvents = 'auto'
            if (this.addLinkMenu)
                this.pathPointerEvents = 'none'

            if (this.useCurvedLinks)
                this.link.append("path")
                    .attr("id", (e, i) => "link_path_" + this.LINKS[i])
                    .attr('class', 'link-line')
                    .attr('fill', 'transparent')
                    .attr("stroke-width", typeof this.linkStrokeWidth !== "function" ? this.linkStrokeWidth : null)
                    .attr("stroke-linecap", this.linkStrokeLinecap)
                    .attr("stroke", this.linkStroke)
                    .attr("style", "pointer-events:" + this.pathPointerEvents)
            else
                this.link.append("line")
                    .attr('class', 'link-line')
                    .attr("stroke", this.linkStroke)
                    .attr("fill", 'none')
                    .attr("stroke-opacity", this.linkStrokeOpacity)
                    .attr("stroke-width", typeof this.linkStrokeWidth !== "function" ? this.linkStrokeWidth : null)
                    .attr("stroke-linecap", this.linkStrokeLinecap)

            if (this.addLinkLabel) {
                this.link.append("circle")
                    .attr('fill', "#545454")
                    .attr('opacity', 0.8)
                    .attr("r", this.nodeRadius / 2)
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
                    .attr("transform", "translate(0," + this.nodeRadius / 1.2 + ")")
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
            .innerRadius(_this.nodeRadius * 1.35)
            .outerRadius(_this.nodeRadius * 2.5)

        let linkArcGenerator = d3.arc()
            .innerRadius(_this.nodeRadius / 2 * 1.35)
            .outerRadius(_this.nodeRadius * 1.5)

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

        path.on("mouseover", function (d) {
            d3.select(this).style("opacity", menuOpacity - 0.1);
        }).on("mouseout", function (d) {
            d3.select(this).style("opacity", menuOpacity);
        })

        g_p.append('text')
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
            .append("title").text((e, i) => menuTitle(menu[i]));

        if (_this.addLinkMenu)
            if (_this.useCurvedLinks)
                _this.link.each(function it(d) {
                    d3.select('#' + _this.containerId).select("#link_" + d['id']).selectAll('.menu-arc')
                        .attr('transform', () => 'translate(' + _this.calcLinkPathCenterX(d)
                            + ', ' + _this.calcLinkPathCenterY(d) + ')')
                })
            else
                _this.link.each(function it(d) {
                    d3.select('#' + _this.containerId).select("#link_" + d['id']).selectAll('.menu-arc')
                        .attr('transform', () => 'translate(' + _this.calcLinkCenterX(d)
                            + ', ' + _this.calcLinkCenterY(d) + ')')
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
                    .attr("d", function (d) {
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
                            var dx = _this.calcLinkWithArrowX2(d) - _this.calcLinkWithArrowX1(d),
                                dy = _this.calcLinkWithArrowY2(d) - _this.calcLinkWithArrowY1(d),
                                dr = Math.sqrt(dx * dx + dy * dy);
                            let repeatedLinkIndex = _this.links.filter(x => (x.source.id == d.source.id && x.target.id == d.target.id) || (x.source.id == d.target.id && x.target.id == d.source.id)).map(x => x.id).indexOf(d.id)
                            let side = (Math.abs(repeatedLinkIndex) % 2 == 0) ? 0 : 1;
                            dr = dr - (repeatedLinkIndex * 50);
                            return "M" + _this.calcLinkWithArrowX1(d) + "," + _this.calcLinkWithArrowY1(d) + "A" + dr + "," + dr + " 0 0," + side + " " + _this.calcLinkWithArrowX2(d) + "," + _this.calcLinkWithArrowY2(d);
                        }
                    })
            })
        else
            _this.link.select(".link-line")
                .attr("x1", d => _this.calcLinkWithArrowX1(d))
                .attr("y1", d => _this.calcLinkWithArrowY1(d))
                .attr("x2", d => _this.calcLinkWithArrowX2(d))
                .attr("y2", d => _this.calcLinkWithArrowY2(d));

        if (_this.addLinkLabel) {
            if (_this.useCurvedLinks) {
                _this.link.select(".link-label")
                    .attr("x", d => _this.calcLinkPathCenterX(d))
                    .attr("y", d => _this.calcLinkPathCenterY(d));

                _this.link.select("circle")
                    .attr("cx", d => _this.calcLinkPathCenterX(d))
                    .attr("cy", d => _this.calcLinkPathCenterY(d));

                _this.link.select(".link-icon")
                    .attr("x", d => _this.calcLinkPathCenterX(d))
                    .attr("y", d => _this.calcLinkPathCenterY(d));
            } else {
                _this.link.select(".link-label")
                    .attr("x", d => _this.calcLinkCenterX(d))
                    .attr("y", d => _this.calcLinkCenterY(d));

                _this.link.select("circle")
                    .attr("cx", d => _this.calcLinkCenterX(d))
                    .attr("cy", d => _this.calcLinkCenterY(d));

                _this.link.select(".link-icon")
                    .attr("x", d => _this.calcLinkCenterX(d))
                    .attr("y", d => _this.calcLinkCenterY(d));
            }
        }

        if (_this.addLinkMenu)
            if (_this.useCurvedLinks)
                _this.link.each(function it(d) {
                    d3.select('#' + _this.containerId).select("#link_" + d['id']).selectAll('.menu-arc')
                        .attr('transform', () => 'translate(' + _this.calcLinkPathCenterX(d)
                            + ', ' + _this.calcLinkPathCenterY(d) + ')')
                })
            else
                _this.link.each(function it(d) {
                    d3.select('#' + _this.containerId).select("#link_" + d['id']).selectAll('.menu-arc')
                        .attr('transform', () => 'translate(' + _this.calcLinkCenterX(d)
                            + ', ' + _this.calcLinkCenterY(d) + ')')
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

    calcLinkWithArrowX1(d) {
        return d.source.x
    }

    calcLinkWithArrowX2(d) {
        if (!this.addLinkArrow) return d.target.x
        let ip =  this.findIntersectionPoint(new Vector(d.target.x, d.target.y), this.nodeRadius * 1.3, new Vector(d.source.x, d.source.y));
        let tp = this.findTangentPoint(new Vector(d.target.x, d.target.y), this.nodeRadius * 1.3, new Vector(d.source.x, d.source.y));
        let mp = new Vector((ip.x + tp.x)/2, (ip.y + tp.y)/2)
        return mp.x;
    }

    calcLinkWithArrowY1(d) {
        return d.source.y
    }

    calcLinkWithArrowY2(d) {
        if (!this.addLinkArrow) return d.target.y
        let ip =  this.findIntersectionPoint(new Vector(d.target.x, d.target.y), this.nodeRadius * 1.3, new Vector(d.source.x, d.source.y));
        let tp = this.findTangentPoint(new Vector(d.target.x, d.target.y), this.nodeRadius * 1.3, new Vector(d.source.x, d.source.y));
        let mp = new Vector((ip.x + tp.x)/2, (ip.y + tp.y)/2)
        return mp.y;
    }

    calcLinkCenterX(d) {
        x1 = this.calcLinkWithArrowX1(d)
        x2 = this.calcLinkWithArrowX2(d)
        return Math.min(x1, x2) + ((Math.max(x1, x2) - Math.min(x1, x2)) / 2)
    }

    calcLinkCenterY(d) {
        y1 = this.calcLinkWithArrowY1(d)
        y2 = this.calcLinkWithArrowY2(d)
        return Math.min(y1, y2) + ((Math.max(y1, y2) - Math.min(y1, y2)) / 2)
    }

    calcLinkPathCenterX(d) {
        var pathEl = d3.select('#' + this.containerId).select("#link_path_" + d['id']).node()
        try {
            return pathEl.getPointAtLength(pathEl.getTotalLength() / 2).x;
        } catch (error) {
            return pathEl.getTotalLength() / 2;
        }
    }

    calcLinkPathCenterY(d) {
        var pathEl = d3.select('#' + this.containerId).select("#link_path_" + d['id']).node()
        try {
            return pathEl.getPointAtLength(pathEl.getTotalLength() / 2).y;
        } catch (error) {
            return pathEl.getTotalLength() / 2;
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

    findTangentPoint(origin, radius, otherLineEndPoint) {
        let dx = origin.x - otherLineEndPoint.x;
        let dy = origin.y - otherLineEndPoint.y;
        let dd = Math.sqrt(dx * dx + dy * dy);
        let a = Math.asin(radius / dd);
        let b = Math.atan2(dy, dx);

        let t1 = b - a
        let ta = new Vector(origin.x + (radius * Math.sin(t1)), origin.y + (radius * -Math.cos(t1)));

        let t2 = b + a
        let tb = new Vector(origin.x + (radius * -Math.sin(t2)), origin.y + (radius * Math.cos(t2)));

        return tb;
    }
}

var fa_unicode_map = {
    "0": "\\u30",
    "1": "\\u31",
    "2": "\\u32",
    "3": "\\u33",
    "4": "\\u34",
    "5": "\\u35",
    "6": "\\u36",
    "7": "\\u37",
    "8": "\\u38",
    "9": "\\u39",
    "42-group": "\ue080",
    "500px": "\uf26e",
    "a": "\\u41",
    "accessible-icon": "\uf368",
    "accusoft": "\uf369",
    "address-book": "\uf2b9",
    "address-card": "\uf2bb",
    "adn": "\uf170",
    "adversal": "\uf36a",
    "affiliatetheme": "\uf36b",
    "airbnb": "\uf834",
    "algolia": "\uf36c",
    "align-center": "\uf037",
    "align-justify": "\uf039",
    "align-left": "\uf036",
    "align-right": "\uf038",
    "alipay": "\uf642",
    "amazon": "\uf270",
    "amazon-pay": "\uf42c",
    "amilia": "\uf36d",
    "anchor": "\uf13d",
    "anchor-circle-check": "\ue4aa",
    "anchor-circle-exclamation": "\ue4ab",
    "anchor-circle-xmark": "\ue4ac",
    "anchor-lock": "\ue4ad",
    "android": "\uf17b",
    "angellist": "\uf209",
    "angle-down": "\uf107",
    "angle-left": "\uf104",
    "angle-right": "\uf105",
    "angle-up": "\uf106",
    "angles-down": "\uf103",
    "angles-left": "\uf100",
    "angles-right": "\uf101",
    "angles-up": "\uf102",
    "angrycreative": "\uf36e",
    "angular": "\uf420",
    "ankh": "\uf644",
    "app-store": "\uf36f",
    "app-store-ios": "\uf370",
    "apper": "\uf371",
    "apple": "\uf179",
    "apple-pay": "\uf415",
    "apple-whole": "\uf5d1",
    "archway": "\uf557",
    "arrow-down": "\uf063",
    "arrow-down-1-9": "\uf162",
    "arrow-down-9-1": "\uf886",
    "arrow-down-a-z": "\uf15d",
    "arrow-down-long": "\uf175",
    "arrow-down-short-wide": "\uf884",
    "arrow-down-up-across-line": "\ue4af",
    "arrow-down-up-lock": "\ue4b0",
    "arrow-down-wide-short": "\uf160",
    "arrow-down-z-a": "\uf881",
    "arrow-left": "\uf060",
    "arrow-left-long": "\uf177",
    "arrow-pointer": "\uf245",
    "arrow-right": "\uf061",
    "arrow-right-arrow-left": "\uf0ec",
    "arrow-right-from-bracket": "\uf08b",
    "arrow-right-long": "\uf178",
    "arrow-right-to-bracket": "\uf090",
    "arrow-right-to-city": "\ue4b3",
    "arrow-rotate-left": "\uf0e2",
    "arrow-rotate-right": "\uf01e",
    "arrow-trend-down": "\ue097",
    "arrow-trend-up": "\ue098",
    "arrow-turn-down": "\uf149",
    "arrow-turn-up": "\uf148",
    "arrow-up": "\uf062",
    "arrow-up-1-9": "\uf163",
    "arrow-up-9-1": "\uf887",
    "arrow-up-a-z": "\uf15e",
    "arrow-up-from-bracket": "\ue09a",
    "arrow-up-from-ground-water": "\ue4b5",
    "arrow-up-from-water-pump": "\ue4b6",
    "arrow-up-long": "\uf176",
    "arrow-up-right-dots": "\ue4b7",
    "arrow-up-right-from-square": "\uf08e",
    "arrow-up-short-wide": "\uf885",
    "arrow-up-wide-short": "\uf161",
    "arrow-up-z-a": "\uf882",
    "arrows-down-to-line": "\ue4b8",
    "arrows-down-to-people": "\ue4b9",
    "arrows-left-right": "\uf07e",
    "arrows-left-right-to-line": "\ue4ba",
    "arrows-rotate": "\uf021",
    "arrows-spin": "\ue4bb",
    "arrows-split-up-and-left": "\ue4bc",
    "arrows-to-circle": "\ue4bd",
    "arrows-to-dot": "\ue4be",
    "arrows-to-eye": "\ue4bf",
    "arrows-turn-right": "\ue4c0",
    "arrows-turn-to-dots": "\ue4c1",
    "arrows-up-down": "\uf07d",
    "arrows-up-down-left-right": "\uf047",
    "arrows-up-to-line": "\ue4c2",
    "artstation": "\uf77a",
    "asterisk": "\\u2a",
    "asymmetrik": "\uf372",
    "at": "\\u40",
    "atlassian": "\uf77b",
    "atom": "\uf5d2",
    "audible": "\uf373",
    "audio-description": "\uf29e",
    "austral-sign": "\ue0a9",
    "autoprefixer": "\uf41c",
    "avianex": "\uf374",
    "aviato": "\uf421",
    "award": "\uf559",
    "aws": "\uf375",
    "b": "\\u42",
    "baby": "\uf77c",
    "baby-carriage": "\uf77d",
    "backward": "\uf04a",
    "backward-fast": "\uf049",
    "backward-step": "\uf048",
    "bacon": "\uf7e5",
    "bacteria": "\ue059",
    "bacterium": "\ue05a",
    "bag-shopping": "\uf290",
    "bahai": "\uf666",
    "baht-sign": "\ue0ac",
    "ban": "\uf05e",
    "ban-smoking": "\uf54d",
    "bandage": "\uf462",
    "bandcamp": "\uf2d5",
    "barcode": "\uf02a",
    "bars": "\uf0c9",
    "bars-progress": "\uf828",
    "bars-staggered": "\uf550",
    "baseball": "\uf433",
    "baseball-bat-ball": "\uf432",
    "basket-shopping": "\uf291",
    "basketball": "\uf434",
    "bath": "\uf2cd",
    "battery-empty": "\uf244",
    "battery-full": "\uf240",
    "battery-half": "\uf242",
    "battery-quarter": "\uf243",
    "battery-three-quarters": "\uf241",
    "battle-net": "\uf835",
    "bed": "\uf236",
    "bed-pulse": "\uf487",
    "beer-mug-empty": "\uf0fc",
    "behance": "\uf1b4",
    "behance-square": "\uf1b5",
    "bell": "\uf0f3",
    "bell-concierge": "\uf562",
    "bell-slash": "\uf1f6",
    "bezier-curve": "\uf55b",
    "bicycle": "\uf206",
    "bilibili": "\ue3d9",
    "bimobject": "\uf378",
    "binoculars": "\uf1e5",
    "biohazard": "\uf780",
    "bitbucket": "\uf171",
    "bitcoin": "\uf379",
    "bitcoin-sign": "\ue0b4",
    "bity": "\uf37a",
    "black-tie": "\uf27e",
    "blackberry": "\uf37b",
    "blender": "\uf517",
    "blender-phone": "\uf6b6",
    "blog": "\uf781",
    "blogger": "\uf37c",
    "blogger-b": "\uf37d",
    "bluetooth": "\uf293",
    "bluetooth-b": "\uf294",
    "bold": "\uf032",
    "bolt": "\uf0e7",
    "bolt-lightning": "\ue0b7",
    "bomb": "\uf1e2",
    "bone": "\uf5d7",
    "bong": "\uf55c",
    "book": "\uf02d",
    "book-atlas": "\uf558",
    "book-bible": "\uf647",
    "book-bookmark": "\ue0bb",
    "book-journal-whills": "\uf66a",
    "book-medical": "\uf7e6",
    "book-open": "\uf518",
    "book-open-reader": "\uf5da",
    "book-quran": "\uf687",
    "book-skull": "\uf6b7",
    "bookmark": "\uf02e",
    "bootstrap": "\uf836",
    "border-all": "\uf84c",
    "border-none": "\uf850",
    "border-top-left": "\uf853",
    "bore-hole": "\ue4c3",
    "bots": "\ue340",
    "bottle-droplet": "\ue4c4",
    "bottle-water": "\ue4c5",
    "bowl-food": "\ue4c6",
    "bowl-rice": "\ue2eb",
    "bowling-ball": "\uf436",
    "box": "\uf466",
    "box-archive": "\uf187",
    "box-open": "\uf49e",
    "box-tissue": "\ue05b",
    "boxes-packing": "\ue4c7",
    "boxes-stacked": "\uf468",
    "braille": "\uf2a1",
    "brain": "\uf5dc",
    "brazilian-real-sign": "\ue46c",
    "bread-slice": "\uf7ec",
    "bridge": "\ue4c8",
    "bridge-circle-check": "\ue4c9",
    "bridge-circle-exclamation": "\ue4ca",
    "bridge-circle-xmark": "\ue4cb",
    "bridge-lock": "\ue4cc",
    "bridge-water": "\ue4ce",
    "briefcase": "\uf0b1",
    "briefcase-medical": "\uf469",
    "broom": "\uf51a",
    "broom-ball": "\uf458",
    "brush": "\uf55d",
    "btc": "\uf15a",
    "bucket": "\ue4cf",
    "buffer": "\uf837",
    "bug": "\uf188",
    "bug-slash": "\ue490",
    "bugs": "\ue4d0",
    "building": "\uf1ad",
    "building-circle-arrow-right": "\ue4d1",
    "building-circle-check": "\ue4d2",
    "building-circle-exclamation": "\ue4d3",
    "building-circle-xmark": "\ue4d4",
    "building-columns": "\uf19c",
    "building-flag": "\ue4d5",
    "building-lock": "\ue4d6",
    "building-ngo": "\ue4d7",
    "building-shield": "\ue4d8",
    "building-un": "\ue4d9",
    "building-user": "\ue4da",
    "building-wheat": "\ue4db",
    "bullhorn": "\uf0a1",
    "bullseye": "\uf140",
    "burger": "\uf805",
    "buromobelexperte": "\uf37f",
    "burst": "\ue4dc",
    "bus": "\uf207",
    "bus-simple": "\uf55e",
    "business-time": "\uf64a",
    "buy-n-large": "\uf8a6",
    "buysellads": "\uf20d",
    "c": "\\u43",
    "cake-candles": "\uf1fd",
    "calculator": "\uf1ec",
    "calendar": "\uf133",
    "calendar-check": "\uf274",
    "calendar-day": "\uf783",
    "calendar-days": "\uf073",
    "calendar-minus": "\uf272",
    "calendar-plus": "\uf271",
    "calendar-week": "\uf784",
    "calendar-xmark": "\uf273",
    "camera": "\uf030",
    "camera-retro": "\uf083",
    "camera-rotate": "\ue0d8",
    "campground": "\uf6bb",
    "canadian-maple-leaf": "\uf785",
    "candy-cane": "\uf786",
    "cannabis": "\uf55f",
    "capsules": "\uf46b",
    "car": "\uf1b9",
    "car-battery": "\uf5df",
    "car-burst": "\uf5e1",
    "car-on": "\ue4dd",
    "car-rear": "\uf5de",
    "car-side": "\uf5e4",
    "car-tunnel": "\ue4de",
    "caravan": "\uf8ff",
    "caret-down": "\uf0d7",
    "caret-left": "\uf0d9",
    "caret-right": "\uf0da",
    "caret-up": "\uf0d8",
    "carrot": "\uf787",
    "cart-arrow-down": "\uf218",
    "cart-flatbed": "\uf474",
    "cart-flatbed-suitcase": "\uf59d",
    "cart-plus": "\uf217",
    "cart-shopping": "\uf07a",
    "cash-register": "\uf788",
    "cat": "\uf6be",
    "cc-amazon-pay": "\uf42d",
    "cc-amex": "\uf1f3",
    "cc-apple-pay": "\uf416",
    "cc-diners-club": "\uf24c",
    "cc-discover": "\uf1f2",
    "cc-jcb": "\uf24b",
    "cc-mastercard": "\uf1f1",
    "cc-paypal": "\uf1f4",
    "cc-stripe": "\uf1f5",
    "cc-visa": "\uf1f0",
    "cedi-sign": "\ue0df",
    "cent-sign": "\ue3f5",
    "centercode": "\uf380",
    "centos": "\uf789",
    "certificate": "\uf0a3",
    "chair": "\uf6c0",
    "chalkboard": "\uf51b",
    "chalkboard-user": "\uf51c",
    "champagne-glasses": "\uf79f",
    "charging-station": "\uf5e7",
    "chart-area": "\uf1fe",
    "chart-bar": "\uf080",
    "chart-column": "\ue0e3",
    "chart-gantt": "\ue0e4",
    "chart-line": "\uf201",
    "chart-pie": "\uf200",
    "chart-simple": "\ue473",
    "check": "\uf00c",
    "check-double": "\uf560",
    "check-to-slot": "\uf772",
    "cheese": "\uf7ef",
    "chess": "\uf439",
    "chess-bishop": "\uf43a",
    "chess-board": "\uf43c",
    "chess-king": "\uf43f",
    "chess-knight": "\uf441",
    "chess-pawn": "\uf443",
    "chess-queen": "\uf445",
    "chess-rook": "\uf447",
    "chevron-down": "\uf078",
    "chevron-left": "\uf053",
    "chevron-right": "\uf054",
    "chevron-up": "\uf077",
    "child": "\uf1ae",
    "child-dress": "\ue59c",
    "child-reaching": "\ue59d",
    "child-rifle": "\ue4e0",
    "children": "\ue4e1",
    "chrome": "\uf268",
    "chromecast": "\uf838",
    "church": "\uf51d",
    "circle": "\uf111",
    "circle-arrow-down": "\uf0ab",
    "circle-arrow-left": "\uf0a8",
    "circle-arrow-right": "\uf0a9",
    "circle-arrow-up": "\uf0aa",
    "circle-check": "\uf058",
    "circle-chevron-down": "\uf13a",
    "circle-chevron-left": "\uf137",
    "circle-chevron-right": "\uf138",
    "circle-chevron-up": "\uf139",
    "circle-dollar-to-slot": "\uf4b9",
    "circle-dot": "\uf192",
    "circle-down": "\uf358",
    "circle-exclamation": "\uf06a",
    "circle-h": "\uf47e",
    "circle-half-stroke": "\uf042",
    "circle-info": "\uf05a",
    "circle-left": "\uf359",
    "circle-minus": "\uf056",
    "circle-nodes": "\ue4e2",
    "circle-notch": "\uf1ce",
    "circle-pause": "\uf28b",
    "circle-play": "\uf144",
    "circle-plus": "\uf055",
    "circle-question": "\uf059",
    "circle-radiation": "\uf7ba",
    "circle-right": "\uf35a",
    "circle-stop": "\uf28d",
    "circle-up": "\uf35b",
    "circle-user": "\uf2bd",
    "circle-xmark": "\uf057",
    "city": "\uf64f",
    "clapperboard": "\ue131",
    "clipboard": "\uf328",
    "clipboard-check": "\uf46c",
    "clipboard-list": "\uf46d",
    "clipboard-question": "\ue4e3",
    "clipboard-user": "\uf7f3",
    "clock": "\uf017",
    "clock-rotate-left": "\uf1da",
    "clone": "\uf24d",
    "closed-captioning": "\uf20a",
    "cloud": "\uf0c2",
    "cloud-arrow-down": "\uf0ed",
    "cloud-arrow-up": "\uf0ee",
    "cloud-bolt": "\uf76c",
    "cloud-meatball": "\uf73b",
    "cloud-moon": "\uf6c3",
    "cloud-moon-rain": "\uf73c",
    "cloud-rain": "\uf73d",
    "cloud-showers-heavy": "\uf740",
    "cloud-showers-water": "\ue4e4",
    "cloud-sun": "\uf6c4",
    "cloud-sun-rain": "\uf743",
    "cloudflare": "\ue07d",
    "cloudscale": "\uf383",
    "cloudsmith": "\uf384",
    "cloudversify": "\uf385",
    "clover": "\ue139",
    "cmplid": "\ue360",
    "code": "\uf121",
    "code-branch": "\uf126",
    "code-commit": "\uf386",
    "code-compare": "\ue13a",
    "code-fork": "\ue13b",
    "code-merge": "\uf387",
    "code-pull-request": "\ue13c",
    "codepen": "\uf1cb",
    "codiepie": "\uf284",
    "coins": "\uf51e",
    "colon-sign": "\ue140",
    "comment": "\uf075",
    "comment-dollar": "\uf651",
    "comment-dots": "\uf4ad",
    "comment-medical": "\uf7f5",
    "comment-slash": "\uf4b3",
    "comment-sms": "\uf7cd",
    "comments": "\uf086",
    "comments-dollar": "\uf653",
    "compact-disc": "\uf51f",
    "compass": "\uf14e",
    "compass-drafting": "\uf568",
    "compress": "\uf066",
    "computer": "\ue4e5",
    "computer-mouse": "\uf8cc",
    "confluence": "\uf78d",
    "connectdevelop": "\uf20e",
    "contao": "\uf26d",
    "cookie": "\uf563",
    "cookie-bite": "\uf564",
    "copy": "\uf0c5",
    "copyright": "\uf1f9",
    "cotton-bureau": "\uf89e",
    "couch": "\uf4b8",
    "cow": "\uf6c8",
    "cpanel": "\uf388",
    "creative-commons": "\uf25e",
    "creative-commons-by": "\uf4e7",
    "creative-commons-nc": "\uf4e8",
    "creative-commons-nc-eu": "\uf4e9",
    "creative-commons-nc-jp": "\uf4ea",
    "creative-commons-nd": "\uf4eb",
    "creative-commons-pd": "\uf4ec",
    "creative-commons-pd-alt": "\uf4ed",
    "creative-commons-remix": "\uf4ee",
    "creative-commons-sa": "\uf4ef",
    "creative-commons-sampling": "\uf4f0",
    "creative-commons-sampling-plus": "\uf4f1",
    "creative-commons-share": "\uf4f2",
    "creative-commons-zero": "\uf4f3",
    "credit-card": "\uf09d",
    "critical-role": "\uf6c9",
    "crop": "\uf125",
    "crop-simple": "\uf565",
    "cross": "\uf654",
    "crosshairs": "\uf05b",
    "crow": "\uf520",
    "crown": "\uf521",
    "crutch": "\uf7f7",
    "cruzeiro-sign": "\ue152",
    "css3": "\uf13c",
    "css3-alt": "\uf38b",
    "cube": "\uf1b2",
    "cubes": "\uf1b3",
    "cubes-stacked": "\ue4e6",
    "cuttlefish": "\uf38c",
    "d": "\\u44",
    "d-and-d": "\uf38d",
    "d-and-d-beyond": "\uf6ca",
    "dailymotion": "\ue052",
    "dashcube": "\uf210",
    "database": "\uf1c0",
    "deezer": "\ue077",
    "delete-left": "\uf55a",
    "delicious": "\uf1a5",
    "democrat": "\uf747",
    "deploydog": "\uf38e",
    "deskpro": "\uf38f",
    "desktop": "\uf390",
    "dev": "\uf6cc",
    "deviantart": "\uf1bd",
    "dharmachakra": "\uf655",
    "dhl": "\uf790",
    "diagram-next": "\ue476",
    "diagram-predecessor": "\ue477",
    "diagram-project": "\uf542",
    "diagram-successor": "\ue47a",
    "diamond": "\uf219",
    "diamond-turn-right": "\uf5eb",
    "diaspora": "\uf791",
    "dice": "\uf522",
    "dice-d20": "\uf6cf",
    "dice-d6": "\uf6d1",
    "dice-five": "\uf523",
    "dice-four": "\uf524",
    "dice-one": "\uf525",
    "dice-six": "\uf526",
    "dice-three": "\uf527",
    "dice-two": "\uf528",
    "digg": "\uf1a6",
    "digital-ocean": "\uf391",
    "discord": "\uf392",
    "discourse": "\uf393",
    "disease": "\uf7fa",
    "display": "\ue163",
    "divide": "\uf529",
    "dna": "\uf471",
    "dochub": "\uf394",
    "docker": "\uf395",
    "dog": "\uf6d3",
    "dollar-sign": "\\u24",
    "dolly": "\uf472",
    "dong-sign": "\ue169",
    "door-closed": "\uf52a",
    "door-open": "\uf52b",
    "dove": "\uf4ba",
    "down-left-and-up-right-to-center": "\uf422",
    "down-long": "\uf309",
    "download": "\uf019",
    "draft2digital": "\uf396",
    "dragon": "\uf6d5",
    "draw-polygon": "\uf5ee",
    "dribbble": "\uf17d",
    "dribbble-square": "\uf397",
    "dropbox": "\uf16b",
    "droplet": "\uf043",
    "droplet-slash": "\uf5c7",
    "drum": "\uf569",
    "drum-steelpan": "\uf56a",
    "drumstick-bite": "\uf6d7",
    "drupal": "\uf1a9",
    "dumbbell": "\uf44b",
    "dumpster": "\uf793",
    "dumpster-fire": "\uf794",
    "dungeon": "\uf6d9",
    "dyalog": "\uf399",
    "e": "\\u45",
    "ear-deaf": "\uf2a4",
    "ear-listen": "\uf2a2",
    "earlybirds": "\uf39a",
    "earth-africa": "\uf57c",
    "earth-americas": "\uf57d",
    "earth-asia": "\uf57e",
    "earth-europe": "\uf7a2",
    "earth-oceania": "\ue47b",
    "ebay": "\uf4f4",
    "edge": "\uf282",
    "edge-legacy": "\ue078",
    "egg": "\uf7fb",
    "eject": "\uf052",
    "elementor": "\uf430",
    "elevator": "\ue16d",
    "ellipsis": "\uf141",
    "ellipsis-vertical": "\uf142",
    "ello": "\uf5f1",
    "ember": "\uf423",
    "empire": "\uf1d1",
    "envelope": "\uf0e0",
    "envelope-circle-check": "\ue4e8",
    "envelope-open": "\uf2b6",
    "envelope-open-text": "\uf658",
    "envelopes-bulk": "\uf674",
    "envira": "\uf299",
    "equals": "\\u3d",
    "eraser": "\uf12d",
    "erlang": "\uf39d",
    "ethereum": "\uf42e",
    "ethernet": "\uf796",
    "etsy": "\uf2d7",
    "euro-sign": "\uf153",
    "evernote": "\uf839",
    "exclamation": "\\u21",
    "expand": "\uf065",
    "expeditedssl": "\uf23e",
    "explosion": "\ue4e9",
    "eye": "\uf06e",
    "eye-dropper": "\uf1fb",
    "eye-low-vision": "\uf2a8",
    "eye-slash": "\uf070",
    "f": "\\u46",
    "face-angry": "\uf556",
    "face-dizzy": "\uf567",
    "face-flushed": "\uf579",
    "face-frown": "\uf119",
    "face-frown-open": "\uf57a",
    "face-grimace": "\uf57f",
    "face-grin": "\uf580",
    "face-grin-beam": "\uf582",
    "face-grin-beam-sweat": "\uf583",
    "face-grin-hearts": "\uf584",
    "face-grin-squint": "\uf585",
    "face-grin-squint-tears": "\uf586",
    "face-grin-stars": "\uf587",
    "face-grin-tears": "\uf588",
    "face-grin-tongue": "\uf589",
    "face-grin-tongue-squint": "\uf58a",
    "face-grin-tongue-wink": "\uf58b",
    "face-grin-wide": "\uf581",
    "face-grin-wink": "\uf58c",
    "face-kiss": "\uf596",
    "face-kiss-beam": "\uf597",
    "face-kiss-wink-heart": "\uf598",
    "face-laugh": "\uf599",
    "face-laugh-beam": "\uf59a",
    "face-laugh-squint": "\uf59b",
    "face-laugh-wink": "\uf59c",
    "face-meh": "\uf11a",
    "face-meh-blank": "\uf5a4",
    "face-rolling-eyes": "\uf5a5",
    "face-sad-cry": "\uf5b3",
    "face-sad-tear": "\uf5b4",
    "face-smile": "\uf118",
    "face-smile-beam": "\uf5b8",
    "face-smile-wink": "\uf4da",
    "face-surprise": "\uf5c2",
    "face-tired": "\uf5c8",
    "facebook": "\uf09a",
    "facebook-f": "\uf39e",
    "facebook-messenger": "\uf39f",
    "facebook-square": "\uf082",
    "fan": "\uf863",
    "fantasy-flight-games": "\uf6dc",
    "faucet": "\ue005",
    "faucet-drip": "\ue006",
    "fax": "\uf1ac",
    "feather": "\uf52d",
    "feather-pointed": "\uf56b",
    "fedex": "\uf797",
    "fedora": "\uf798",
    "ferry": "\ue4ea",
    "figma": "\uf799",
    "file": "\uf15b",
    "file-arrow-down": "\uf56d",
    "file-arrow-up": "\uf574",
    "file-audio": "\uf1c7",
    "file-circle-check": "\ue493",
    "file-circle-exclamation": "\ue4eb",
    "file-circle-minus": "\ue4ed",
    "file-circle-plus": "\ue4ee",
    "file-circle-question": "\ue4ef",
    "file-circle-xmark": "\ue494",
    "file-code": "\uf1c9",
    "file-contract": "\uf56c",
    "file-csv": "\uf6dd",
    "file-excel": "\uf1c3",
    "file-export": "\uf56e",
    "file-image": "\uf1c5",
    "file-import": "\uf56f",
    "file-invoice": "\uf570",
    "file-invoice-dollar": "\uf571",
    "file-lines": "\uf15c",
    "file-medical": "\uf477",
    "file-pdf": "\uf1c1",
    "file-pen": "\uf31c",
    "file-powerpoint": "\uf1c4",
    "file-prescription": "\uf572",
    "file-shield": "\ue4f0",
    "file-signature": "\uf573",
    "file-video": "\uf1c8",
    "file-waveform": "\uf478",
    "file-word": "\uf1c2",
    "file-zipper": "\uf1c6",
    "fill": "\uf575",
    "fill-drip": "\uf576",
    "film": "\uf008",
    "filter": "\uf0b0",
    "filter-circle-dollar": "\uf662",
    "filter-circle-xmark": "\ue17b",
    "fingerprint": "\uf577",
    "fire": "\uf06d",
    "fire-burner": "\ue4f1",
    "fire-extinguisher": "\uf134",
    "fire-flame-curved": "\uf7e4",
    "fire-flame-simple": "\uf46a",
    "firefox": "\uf269",
    "firefox-browser": "\ue007",
    "first-order": "\uf2b0",
    "first-order-alt": "\uf50a",
    "firstdraft": "\uf3a1",
    "fish": "\uf578",
    "fish-fins": "\ue4f2",
    "flag": "\uf024",
    "flag-checkered": "\uf11e",
    "flag-usa": "\uf74d",
    "flask": "\uf0c3",
    "flask-vial": "\ue4f3",
    "flickr": "\uf16e",
    "flipboard": "\uf44d",
    "floppy-disk": "\uf0c7",
    "florin-sign": "\ue184",
    "fly": "\uf417",
    "folder": "\uf07b",
    "folder-closed": "\ue185",
    "folder-minus": "\uf65d",
    "folder-open": "\uf07c",
    "folder-plus": "\uf65e",
    "folder-tree": "\uf802",
    "font": "\uf031",
    "font-awesome": "\uf2b4",
    "fonticons": "\uf280",
    "fonticons-fi": "\uf3a2",
    "football": "\uf44e",
    "fort-awesome": "\uf286",
    "fort-awesome-alt": "\uf3a3",
    "forumbee": "\uf211",
    "forward": "\uf04e",
    "forward-fast": "\uf050",
    "forward-step": "\uf051",
    "foursquare": "\uf180",
    "franc-sign": "\ue18f",
    "free-code-camp": "\uf2c5",
    "freebsd": "\uf3a4",
    "frog": "\uf52e",
    "fulcrum": "\uf50b",
    "futbol": "\uf1e3",
    "g": "\\u47",
    "galactic-republic": "\uf50c",
    "galactic-senate": "\uf50d",
    "gamepad": "\uf11b",
    "gas-pump": "\uf52f",
    "gauge": "\uf624",
    "gauge-high": "\uf625",
    "gauge-simple": "\uf629",
    "gauge-simple-high": "\uf62a",
    "gavel": "\uf0e3",
    "gear": "\uf013",
    "gears": "\uf085",
    "gem": "\uf3a5",
    "genderless": "\uf22d",
    "get-pocket": "\uf265",
    "gg": "\uf260",
    "gg-circle": "\uf261",
    "ghost": "\uf6e2",
    "gift": "\uf06b",
    "gifts": "\uf79c",
    "git": "\uf1d3",
    "git-alt": "\uf841",
    "git-square": "\uf1d2",
    "github": "\uf09b",
    "github-alt": "\uf113",
    "github-square": "\uf092",
    "gitkraken": "\uf3a6",
    "gitlab": "\uf296",
    "gitter": "\uf426",
    "glass-water": "\ue4f4",
    "glass-water-droplet": "\ue4f5",
    "glasses": "\uf530",
    "glide": "\uf2a5",
    "glide-g": "\uf2a6",
    "globe": "\uf0ac",
    "gofore": "\uf3a7",
    "golang": "\ue40f",
    "golf-ball-tee": "\uf450",
    "goodreads": "\uf3a8",
    "goodreads-g": "\uf3a9",
    "google": "\uf1a0",
    "google-drive": "\uf3aa",
    "google-pay": "\ue079",
    "google-play": "\uf3ab",
    "google-plus": "\uf2b3",
    "google-plus-g": "\uf0d5",
    "google-plus-square": "\uf0d4",
    "google-wallet": "\uf1ee",
    "gopuram": "\uf664",
    "graduation-cap": "\uf19d",
    "gratipay": "\uf184",
    "grav": "\uf2d6",
    "greater-than": "\\u3e",
    "greater-than-equal": "\uf532",
    "grip": "\uf58d",
    "grip-lines": "\uf7a4",
    "grip-lines-vertical": "\uf7a5",
    "grip-vertical": "\uf58e",
    "gripfire": "\uf3ac",
    "group-arrows-rotate": "\ue4f6",
    "grunt": "\uf3ad",
    "guarani-sign": "\ue19a",
    "guilded": "\ue07e",
    "guitar": "\uf7a6",
    "gulp": "\uf3ae",
    "gun": "\ue19b",
    "h": "\\u48",
    "hacker-news": "\uf1d4",
    "hacker-news-square": "\uf3af",
    "hackerrank": "\uf5f7",
    "hammer": "\uf6e3",
    "hamsa": "\uf665",
    "hand": "\uf256",
    "hand-back-fist": "\uf255",
    "hand-dots": "\uf461",
    "hand-fist": "\uf6de",
    "hand-holding": "\uf4bd",
    "hand-holding-dollar": "\uf4c0",
    "hand-holding-droplet": "\uf4c1",
    "hand-holding-hand": "\ue4f7",
    "hand-holding-heart": "\uf4be",
    "hand-holding-medical": "\ue05c",
    "hand-lizard": "\uf258",
    "hand-middle-finger": "\uf806",
    "hand-peace": "\uf25b",
    "hand-point-down": "\uf0a7",
    "hand-point-left": "\uf0a5",
    "hand-point-right": "\uf0a4",
    "hand-point-up": "\uf0a6",
    "hand-pointer": "\uf25a",
    "hand-scissors": "\uf257",
    "hand-sparkles": "\ue05d",
    "hand-spock": "\uf259",
    "handcuffs": "\ue4f8",
    "hands": "\uf2a7",
    "hands-asl-interpreting": "\uf2a3",
    "hands-bound": "\ue4f9",
    "hands-bubbles": "\ue05e",
    "hands-clapping": "\ue1a8",
    "hands-holding": "\uf4c2",
    "hands-holding-child": "\ue4fa",
    "hands-holding-circle": "\ue4fb",
    "hands-praying": "\uf684",
    "handshake": "\uf2b5",
    "handshake-angle": "\uf4c4",
    "handshake-simple": "\uf4c6",
    "handshake-simple-slash": "\ue05f",
    "handshake-slash": "\ue060",
    "hanukiah": "\uf6e6",
    "hard-drive": "\uf0a0",
    "hashnode": "\ue499",
    "hashtag": "\\u23",
    "hat-cowboy": "\uf8c0",
    "hat-cowboy-side": "\uf8c1",
    "hat-wizard": "\uf6e8",
    "head-side-cough": "\ue061",
    "head-side-cough-slash": "\ue062",
    "head-side-mask": "\ue063",
    "head-side-virus": "\ue064",
    "heading": "\uf1dc",
    "headphones": "\uf025",
    "headphones-simple": "\uf58f",
    "headset": "\uf590",
    "heart": "\uf004",
    "heart-circle-bolt": "\ue4fc",
    "heart-circle-check": "\ue4fd",
    "heart-circle-exclamation": "\ue4fe",
    "heart-circle-minus": "\ue4ff",
    "heart-circle-plus": "\ue500",
    "heart-circle-xmark": "\ue501",
    "heart-crack": "\uf7a9",
    "heart-pulse": "\uf21e",
    "helicopter": "\uf533",
    "helicopter-symbol": "\ue502",
    "helmet-safety": "\uf807",
    "helmet-un": "\ue503",
    "highlighter": "\uf591",
    "hill-avalanche": "\ue507",
    "hill-rockslide": "\ue508",
    "hippo": "\uf6ed",
    "hips": "\uf452",
    "hire-a-helper": "\uf3b0",
    "hive": "\ue07f",
    "hockey-puck": "\uf453",
    "holly-berry": "\uf7aa",
    "hooli": "\uf427",
    "hornbill": "\uf592",
    "horse": "\uf6f0",
    "horse-head": "\uf7ab",
    "hospital": "\uf0f8",
    "hospital-user": "\uf80d",
    "hot-tub-person": "\uf593",
    "hotdog": "\uf80f",
    "hotel": "\uf594",
    "hotjar": "\uf3b1",
    "hourglass": "\uf254",
    "hourglass-empty": "\uf252",
    "hourglass-end": "\uf253",
    "hourglass-start": "\uf251",
    "house": "\uf015",
    "house-chimney": "\ue3af",
    "house-chimney-crack": "\uf6f1",
    "house-chimney-medical": "\uf7f2",
    "house-chimney-user": "\ue065",
    "house-chimney-window": "\ue00d",
    "house-circle-check": "\ue509",
    "house-circle-exclamation": "\ue50a",
    "house-circle-xmark": "\ue50b",
    "house-crack": "\ue3b1",
    "house-fire": "\ue50c",
    "house-flag": "\ue50d",
    "house-flood-water": "\ue50e",
    "house-flood-water-circle-arrow-right": "\ue50f",
    "house-laptop": "\ue066",
    "house-lock": "\ue510",
    "house-medical": "\ue3b2",
    "house-medical-circle-check": "\ue511",
    "house-medical-circle-exclamation": "\ue512",
    "house-medical-circle-xmark": "\ue513",
    "house-medical-flag": "\ue514",
    "house-signal": "\ue012",
    "house-tsunami": "\ue515",
    "house-user": "\ue1b0",
    "houzz": "\uf27c",
    "hryvnia-sign": "\uf6f2",
    "html5": "\uf13b",
    "hubspot": "\uf3b2",
    "hurricane": "\uf751",
    "i": "\\u49",
    "i-cursor": "\uf246",
    "ice-cream": "\uf810",
    "icicles": "\uf7ad",
    "icons": "\uf86d",
    "id-badge": "\uf2c1",
    "id-card": "\uf2c2",
    "id-card-clip": "\uf47f",
    "ideal": "\ue013",
    "igloo": "\uf7ae",
    "image": "\uf03e",
    "image-portrait": "\uf3e0",
    "images": "\uf302",
    "imdb": "\uf2d8",
    "inbox": "\uf01c",
    "indent": "\uf03c",
    "indian-rupee-sign": "\ue1bc",
    "industry": "\uf275",
    "infinity": "\uf534",
    "info": "\uf129",
    "instagram": "\uf16d",
    "instagram-square": "\ue055",
    "instalod": "\ue081",
    "intercom": "\uf7af",
    "internet-explorer": "\uf26b",
    "invision": "\uf7b0",
    "ioxhost": "\uf208",
    "italic": "\uf033",
    "itch-io": "\uf83a",
    "itunes": "\uf3b4",
    "itunes-note": "\uf3b5",
    "j": "\\u4a",
    "jar": "\ue516",
    "jar-wheat": "\ue517",
    "java": "\uf4e4",
    "jedi": "\uf669",
    "jedi-order": "\uf50e",
    "jenkins": "\uf3b6",
    "jet-fighter": "\uf0fb",
    "jet-fighter-up": "\ue518",
    "jira": "\uf7b1",
    "joget": "\uf3b7",
    "joint": "\uf595",
    "joomla": "\uf1aa",
    "js": "\uf3b8",
    "js-square": "\uf3b9",
    "jsfiddle": "\uf1cc",
    "jug-detergent": "\ue519",
    "k": "\\u4b",
    "kaaba": "\uf66b",
    "kaggle": "\uf5fa",
    "key": "\uf084",
    "keybase": "\uf4f5",
    "keyboard": "\uf11c",
    "keycdn": "\uf3ba",
    "khanda": "\uf66d",
    "kickstarter": "\uf3bb",
    "kickstarter-k": "\uf3bc",
    "kip-sign": "\ue1c4",
    "kit-medical": "\uf479",
    "kitchen-set": "\ue51a",
    "kiwi-bird": "\uf535",
    "korvue": "\uf42f",
    "l": "\\u4c",
    "land-mine-on": "\ue51b",
    "landmark": "\uf66f",
    "landmark-dome": "\uf752",
    "landmark-flag": "\ue51c",
    "language": "\uf1ab",
    "laptop": "\uf109",
    "laptop-code": "\uf5fc",
    "laptop-file": "\ue51d",
    "laptop-medical": "\uf812",
    "laravel": "\uf3bd",
    "lari-sign": "\ue1c8",
    "lastfm": "\uf202",
    "lastfm-square": "\uf203",
    "layer-group": "\uf5fd",
    "leaf": "\uf06c",
    "leanpub": "\uf212",
    "left-long": "\uf30a",
    "left-right": "\uf337",
    "lemon": "\uf094",
    "less": "\uf41d",
    "less-than": "\\u3c",
    "less-than-equal": "\uf537",
    "life-ring": "\uf1cd",
    "lightbulb": "\uf0eb",
    "line": "\uf3c0",
    "lines-leaning": "\ue51e",
    "link": "\uf0c1",
    "link-slash": "\uf127",
    "linkedin": "\uf08c",
    "linkedin-in": "\uf0e1",
    "linode": "\uf2b8",
    "linux": "\uf17c",
    "lira-sign": "\uf195",
    "list": "\uf03a",
    "list-check": "\uf0ae",
    "list-ol": "\uf0cb",
    "list-ul": "\uf0ca",
    "litecoin-sign": "\ue1d3",
    "location-arrow": "\uf124",
    "location-crosshairs": "\uf601",
    "location-dot": "\uf3c5",
    "location-pin": "\uf041",
    "location-pin-lock": "\ue51f",
    "lock": "\uf023",
    "lock-open": "\uf3c1",
    "locust": "\ue520",
    "lungs": "\uf604",
    "lungs-virus": "\ue067",
    "lyft": "\uf3c3",
    "m": "\\u4d",
    "magento": "\uf3c4",
    "magnet": "\uf076",
    "magnifying-glass": "\uf002",
    "magnifying-glass-arrow-right": "\ue521",
    "magnifying-glass-chart": "\ue522",
    "magnifying-glass-dollar": "\uf688",
    "magnifying-glass-location": "\uf689",
    "magnifying-glass-minus": "\uf010",
    "magnifying-glass-plus": "\uf00e",
    "mailchimp": "\uf59e",
    "manat-sign": "\ue1d5",
    "mandalorian": "\uf50f",
    "map": "\uf279",
    "map-location": "\uf59f",
    "map-location-dot": "\uf5a0",
    "map-pin": "\uf276",
    "markdown": "\uf60f",
    "marker": "\uf5a1",
    "mars": "\uf222",
    "mars-and-venus": "\uf224",
    "mars-and-venus-burst": "\ue523",
    "mars-double": "\uf227",
    "mars-stroke": "\uf229",
    "mars-stroke-right": "\uf22b",
    "mars-stroke-up": "\uf22a",
    "martini-glass": "\uf57b",
    "martini-glass-citrus": "\uf561",
    "martini-glass-empty": "\uf000",
    "mask": "\uf6fa",
    "mask-face": "\ue1d7",
    "mask-ventilator": "\ue524",
    "masks-theater": "\uf630",
    "mastodon": "\uf4f6",
    "mattress-pillow": "\ue525",
    "maxcdn": "\uf136",
    "maximize": "\uf31e",
    "mdb": "\uf8ca",
    "medal": "\uf5a2",
    "medapps": "\uf3c6",
    "medium": "\uf23a",
    "medrt": "\uf3c8",
    "meetup": "\uf2e0",
    "megaport": "\uf5a3",
    "memory": "\uf538",
    "mendeley": "\uf7b3",
    "menorah": "\uf676",
    "mercury": "\uf223",
    "message": "\uf27a",
    "meteor": "\uf753",
    "microblog": "\ue01a",
    "microchip": "\uf2db",
    "microphone": "\uf130",
    "microphone-lines": "\uf3c9",
    "microphone-lines-slash": "\uf539",
    "microphone-slash": "\uf131",
    "microscope": "\uf610",
    "microsoft": "\uf3ca",
    "mill-sign": "\ue1ed",
    "minimize": "\uf78c",
    "minus": "\uf068",
    "mitten": "\uf7b5",
    "mix": "\uf3cb",
    "mixcloud": "\uf289",
    "mixer": "\ue056",
    "mizuni": "\uf3cc",
    "mobile": "\uf3ce",
    "mobile-button": "\uf10b",
    "mobile-retro": "\ue527",
    "mobile-screen": "\uf3cf",
    "mobile-screen-button": "\uf3cd",
    "modx": "\uf285",
    "monero": "\uf3d0",
    "money-bill": "\uf0d6",
    "money-bill-1": "\uf3d1",
    "money-bill-1-wave": "\uf53b",
    "money-bill-transfer": "\ue528",
    "money-bill-trend-up": "\ue529",
    "money-bill-wave": "\uf53a",
    "money-bill-wheat": "\ue52a",
    "money-bills": "\ue1f3",
    "money-check": "\uf53c",
    "money-check-dollar": "\uf53d",
    "monument": "\uf5a6",
    "moon": "\uf186",
    "mortar-pestle": "\uf5a7",
    "mosque": "\uf678",
    "mosquito": "\ue52b",
    "mosquito-net": "\ue52c",
    "motorcycle": "\uf21c",
    "mound": "\ue52d",
    "mountain": "\uf6fc",
    "mountain-city": "\ue52e",
    "mountain-sun": "\ue52f",
    "mug-hot": "\uf7b6",
    "mug-saucer": "\uf0f4",
    "music": "\uf001",
    "n": "\\u4e",
    "naira-sign": "\ue1f6",
    "napster": "\uf3d2",
    "neos": "\uf612",
    "network-wired": "\uf6ff",
    "neuter": "\uf22c",
    "newspaper": "\uf1ea",
    "nfc-directional": "\ue530",
    "nfc-symbol": "\ue531",
    "nimblr": "\uf5a8",
    "node": "\uf419",
    "node-js": "\uf3d3",
    "not-equal": "\uf53e",
    "note-sticky": "\uf249",
    "notes-medical": "\uf481",
    "npm": "\uf3d4",
    "ns8": "\uf3d5",
    "nutritionix": "\uf3d6",
    "o": "\\u4f",
    "object-group": "\uf247",
    "object-ungroup": "\uf248",
    "octopus-deploy": "\ue082",
    "odnoklassniki": "\uf263",
    "odnoklassniki-square": "\uf264",
    "oil-can": "\uf613",
    "oil-well": "\ue532",
    "old-republic": "\uf510",
    "om": "\uf679",
    "opencart": "\uf23d",
    "openid": "\uf19b",
    "opera": "\uf26a",
    "optin-monster": "\uf23c",
    "orcid": "\uf8d2",
    "osi": "\uf41a",
    "otter": "\uf700",
    "outdent": "\uf03b",
    "p": "\\u50",
    "padlet": "\ue4a0",
    "page4": "\uf3d7",
    "pagelines": "\uf18c",
    "pager": "\uf815",
    "paint-roller": "\uf5aa",
    "paintbrush": "\uf1fc",
    "palette": "\uf53f",
    "palfed": "\uf3d8",
    "pallet": "\uf482",
    "panorama": "\ue209",
    "paper-plane": "\uf1d8",
    "paperclip": "\uf0c6",
    "parachute-box": "\uf4cd",
    "paragraph": "\uf1dd",
    "passport": "\uf5ab",
    "paste": "\uf0ea",
    "patreon": "\uf3d9",
    "pause": "\uf04c",
    "paw": "\uf1b0",
    "paypal": "\uf1ed",
    "peace": "\uf67c",
    "pen": "\uf304",
    "pen-clip": "\uf305",
    "pen-fancy": "\uf5ac",
    "pen-nib": "\uf5ad",
    "pen-ruler": "\uf5ae",
    "pen-to-square": "\uf044",
    "pencil": "\uf303",
    "people-arrows-left-right": "\ue068",
    "people-carry-box": "\uf4ce",
    "people-group": "\ue533",
    "people-line": "\ue534",
    "people-pulling": "\ue535",
    "people-robbery": "\ue536",
    "people-roof": "\ue537",
    "pepper-hot": "\uf816",
    "perbyte": "\ue083",
    "percent": "\\u25",
    "periscope": "\uf3da",
    "person": "\uf183",
    "person-arrow-down-to-line": "\ue538",
    "person-arrow-up-from-line": "\ue539",
    "person-biking": "\uf84a",
    "person-booth": "\uf756",
    "person-breastfeeding": "\ue53a",
    "person-burst": "\ue53b",
    "person-cane": "\ue53c",
    "person-chalkboard": "\ue53d",
    "person-circle-check": "\ue53e",
    "person-circle-exclamation": "\ue53f",
    "person-circle-minus": "\ue540",
    "person-circle-plus": "\ue541",
    "person-circle-question": "\ue542",
    "person-circle-xmark": "\ue543",
    "person-digging": "\uf85e",
    "person-dots-from-line": "\uf470",
    "person-dress": "\uf182",
    "person-dress-burst": "\ue544",
    "person-drowning": "\ue545",
    "person-falling": "\ue546",
    "person-falling-burst": "\ue547",
    "person-half-dress": "\ue548",
    "person-harassing": "\ue549",
    "person-hiking": "\uf6ec",
    "person-military-pointing": "\ue54a",
    "person-military-rifle": "\ue54b",
    "person-military-to-person": "\ue54c",
    "person-praying": "\uf683",
    "person-pregnant": "\ue31e",
    "person-rays": "\ue54d",
    "person-rifle": "\ue54e",
    "person-running": "\uf70c",
    "person-shelter": "\ue54f",
    "person-skating": "\uf7c5",
    "person-skiing": "\uf7c9",
    "person-skiing-nordic": "\uf7ca",
    "person-snowboarding": "\uf7ce",
    "person-swimming": "\uf5c4",
    "person-through-window": "\ue433",
    "person-walking": "\uf554",
    "person-walking-arrow-loop-left": "\ue551",
    "person-walking-arrow-right": "\ue552",
    "person-walking-dashed-line-arrow-right": "\ue553",
    "person-walking-luggage": "\ue554",
    "person-walking-with-cane": "\uf29d",
    "peseta-sign": "\ue221",
    "peso-sign": "\ue222",
    "phabricator": "\uf3db",
    "phoenix-framework": "\uf3dc",
    "phoenix-squadron": "\uf511",
    "phone": "\uf095",
    "phone-flip": "\uf879",
    "phone-slash": "\uf3dd",
    "phone-volume": "\uf2a0",
    "photo-film": "\uf87c",
    "php": "\uf457",
    "pied-piper": "\uf2ae",
    "pied-piper-alt": "\uf1a8",
    "pied-piper-hat": "\uf4e5",
    "pied-piper-pp": "\uf1a7",
    "pied-piper-square": "\ue01e",
    "piggy-bank": "\uf4d3",
    "pills": "\uf484",
    "pinterest": "\uf0d2",
    "pinterest-p": "\uf231",
    "pinterest-square": "\uf0d3",
    "pix": "\ue43a",
    "pizza-slice": "\uf818",
    "place-of-worship": "\uf67f",
    "plane": "\uf072",
    "plane-arrival": "\uf5af",
    "plane-circle-check": "\ue555",
    "plane-circle-exclamation": "\ue556",
    "plane-circle-xmark": "\ue557",
    "plane-departure": "\uf5b0",
    "plane-lock": "\ue558",
    "plane-slash": "\ue069",
    "plane-up": "\ue22d",
    "plant-wilt": "\ue43b",
    "plate-wheat": "\ue55a",
    "play": "\uf04b",
    "playstation": "\uf3df",
    "plug": "\uf1e6",
    "plug-circle-bolt": "\ue55b",
    "plug-circle-check": "\ue55c",
    "plug-circle-exclamation": "\ue55d",
    "plug-circle-minus": "\ue55e",
    "plug-circle-plus": "\ue55f",
    "plug-circle-xmark": "\ue560",
    "plus": "\\u2b",
    "plus-minus": "\ue43c",
    "podcast": "\uf2ce",
    "poo": "\uf2fe",
    "poo-storm": "\uf75a",
    "poop": "\uf619",
    "power-off": "\uf011",
    "prescription": "\uf5b1",
    "prescription-bottle": "\uf485",
    "prescription-bottle-medical": "\uf486",
    "print": "\uf02f",
    "product-hunt": "\uf288",
    "pump-medical": "\ue06a",
    "pump-soap": "\ue06b",
    "pushed": "\uf3e1",
    "puzzle-piece": "\uf12e",
    "python": "\uf3e2",
    "q": "\\u51",
    "qq": "\uf1d6",
    "qrcode": "\uf029",
    "question": "\\u3f",
    "quinscape": "\uf459",
    "quora": "\uf2c4",
    "quote-left": "\uf10d",
    "quote-right": "\uf10e",
    "r": "\\u52",
    "r-project": "\uf4f7",
    "radiation": "\uf7b9",
    "radio": "\uf8d7",
    "rainbow": "\uf75b",
    "ranking-star": "\ue561",
    "raspberry-pi": "\uf7bb",
    "ravelry": "\uf2d9",
    "react": "\uf41b",
    "reacteurope": "\uf75d",
    "readme": "\uf4d5",
    "rebel": "\uf1d0",
    "receipt": "\uf543",
    "record-vinyl": "\uf8d9",
    "rectangle-ad": "\uf641",
    "rectangle-list": "\uf022",
    "rectangle-xmark": "\uf410",
    "recycle": "\uf1b8",
    "red-river": "\uf3e3",
    "reddit": "\uf1a1",
    "reddit-alien": "\uf281",
    "reddit-square": "\uf1a2",
    "redhat": "\uf7bc",
    "registered": "\uf25d",
    "renren": "\uf18b",
    "repeat": "\uf363",
    "reply": "\uf3e5",
    "reply-all": "\uf122",
    "replyd": "\uf3e6",
    "republican": "\uf75e",
    "researchgate": "\uf4f8",
    "resolving": "\uf3e7",
    "restroom": "\uf7bd",
    "retweet": "\uf079",
    "rev": "\uf5b2",
    "ribbon": "\uf4d6",
    "right-from-bracket": "\uf2f5",
    "right-left": "\uf362",
    "right-long": "\uf30b",
    "right-to-bracket": "\uf2f6",
    "ring": "\uf70b",
    "road": "\uf018",
    "road-barrier": "\ue562",
    "road-bridge": "\ue563",
    "road-circle-check": "\ue564",
    "road-circle-exclamation": "\ue565",
    "road-circle-xmark": "\ue566",
    "road-lock": "\ue567",
    "road-spikes": "\ue568",
    "robot": "\uf544",
    "rocket": "\uf135",
    "rocketchat": "\uf3e8",
    "rockrms": "\uf3e9",
    "rotate": "\uf2f1",
    "rotate-left": "\uf2ea",
    "rotate-right": "\uf2f9",
    "route": "\uf4d7",
    "rss": "\uf09e",
    "ruble-sign": "\uf158",
    "rug": "\ue569",
    "ruler": "\uf545",
    "ruler-combined": "\uf546",
    "ruler-horizontal": "\uf547",
    "ruler-vertical": "\uf548",
    "rupee-sign": "\uf156",
    "rupiah-sign": "\ue23d",
    "rust": "\ue07a",
    "s": "\\u53",
    "sack-dollar": "\uf81d",
    "sack-xmark": "\ue56a",
    "safari": "\uf267",
    "sailboat": "\ue445",
    "salesforce": "\uf83b",
    "sass": "\uf41e",
    "satellite": "\uf7bf",
    "satellite-dish": "\uf7c0",
    "scale-balanced": "\uf24e",
    "scale-unbalanced": "\uf515",
    "scale-unbalanced-flip": "\uf516",
    "schlix": "\uf3ea",
    "school": "\uf549",
    "school-circle-check": "\ue56b",
    "school-circle-exclamation": "\ue56c",
    "school-circle-xmark": "\ue56d",
    "school-flag": "\ue56e",
    "school-lock": "\ue56f",
    "scissors": "\uf0c4",
    "screenpal": "\ue570",
    "screwdriver": "\uf54a",
    "screwdriver-wrench": "\uf7d9",
    "scribd": "\uf28a",
    "scroll": "\uf70e",
    "scroll-torah": "\uf6a0",
    "sd-card": "\uf7c2",
    "searchengin": "\uf3eb",
    "section": "\ue447",
    "seedling": "\uf4d8",
    "sellcast": "\uf2da",
    "sellsy": "\uf213",
    "server": "\uf233",
    "servicestack": "\uf3ec",
    "shapes": "\uf61f",
    "share": "\uf064",
    "share-from-square": "\uf14d",
    "share-nodes": "\uf1e0",
    "sheet-plastic": "\ue571",
    "shekel-sign": "\uf20b",
    "shield": "\uf132",
    "shield-cat": "\ue572",
    "shield-dog": "\ue573",
    "shield-halved": "\uf3ed",
    "shield-heart": "\ue574",
    "shield-virus": "\ue06c",
    "ship": "\uf21a",
    "shirt": "\uf553",
    "shirtsinbulk": "\uf214",
    "shoe-prints": "\uf54b",
    "shop": "\uf54f",
    "shop-lock": "\ue4a5",
    "shop-slash": "\ue070",
    "shopify": "\ue057",
    "shopware": "\uf5b5",
    "shower": "\uf2cc",
    "shrimp": "\ue448",
    "shuffle": "\uf074",
    "shuttle-space": "\uf197",
    "sign-hanging": "\uf4d9",
    "signal": "\uf012",
    "signature": "\uf5b7",
    "signs-post": "\uf277",
    "sim-card": "\uf7c4",
    "simplybuilt": "\uf215",
    "sink": "\ue06d",
    "sistrix": "\uf3ee",
    "sitemap": "\uf0e8",
    "sith": "\uf512",
    "sitrox": "\ue44a",
    "sketch": "\uf7c6",
    "skull": "\uf54c",
    "skull-crossbones": "\uf714",
    "skyatlas": "\uf216",
    "skype": "\uf17e",
    "slack": "\uf198",
    "slash": "\uf715",
    "sleigh": "\uf7cc",
    "sliders": "\uf1de",
    "slideshare": "\uf1e7",
    "smog": "\uf75f",
    "smoking": "\uf48d",
    "snapchat": "\uf2ab",
    "snapchat-square": "\uf2ad",
    "snowflake": "\uf2dc",
    "snowman": "\uf7d0",
    "snowplow": "\uf7d2",
    "soap": "\ue06e",
    "socks": "\uf696",
    "solar-panel": "\uf5ba",
    "sort": "\uf0dc",
    "sort-down": "\uf0dd",
    "sort-up": "\uf0de",
    "soundcloud": "\uf1be",
    "sourcetree": "\uf7d3",
    "spa": "\uf5bb",
    "spaghetti-monster-flying": "\uf67b",
    "speakap": "\uf3f3",
    "speaker-deck": "\uf83c",
    "spell-check": "\uf891",
    "spider": "\uf717",
    "spinner": "\uf110",
    "splotch": "\uf5bc",
    "spoon": "\uf2e5",
    "spotify": "\uf1bc",
    "spray-can": "\uf5bd",
    "spray-can-sparkles": "\uf5d0",
    "square": "\uf0c8",
    "square-arrow-up-right": "\uf14c",
    "square-caret-down": "\uf150",
    "square-caret-left": "\uf191",
    "square-caret-right": "\uf152",
    "square-caret-up": "\uf151",
    "square-check": "\uf14a",
    "square-envelope": "\uf199",
    "square-font-awesome": "\uf425",
    "square-font-awesome-stroke": "\uf35c",
    "square-full": "\uf45c",
    "square-h": "\uf0fd",
    "square-minus": "\uf146",
    "square-nfi": "\ue576",
    "square-parking": "\uf540",
    "square-pen": "\uf14b",
    "square-person-confined": "\ue577",
    "square-phone": "\uf098",
    "square-phone-flip": "\uf87b",
    "square-plus": "\uf0fe",
    "square-poll-horizontal": "\uf682",
    "square-poll-vertical": "\uf681",
    "square-root-variable": "\uf698",
    "square-rss": "\uf143",
    "square-share-nodes": "\uf1e1",
    "square-up-right": "\uf360",
    "square-virus": "\ue578",
    "square-xmark": "\uf2d3",
    "squarespace": "\uf5be",
    "stack-exchange": "\uf18d",
    "stack-overflow": "\uf16c",
    "stackpath": "\uf842",
    "staff-aesculapius": "\ue579",
    "stairs": "\ue289",
    "stamp": "\uf5bf",
    "star": "\uf005",
    "star-and-crescent": "\uf699",
    "star-half": "\uf089",
    "star-half-stroke": "\uf5c0",
    "star-of-david": "\uf69a",
    "star-of-life": "\uf621",
    "staylinked": "\uf3f5",
    "steam": "\uf1b6",
    "steam-square": "\uf1b7",
    "steam-symbol": "\uf3f6",
    "sterling-sign": "\uf154",
    "stethoscope": "\uf0f1",
    "sticker-mule": "\uf3f7",
    "stop": "\uf04d",
    "stopwatch": "\uf2f2",
    "stopwatch-20": "\ue06f",
    "store": "\uf54e",
    "store-slash": "\ue071",
    "strava": "\uf428",
    "street-view": "\uf21d",
    "strikethrough": "\uf0cc",
    "stripe": "\uf429",
    "stripe-s": "\uf42a",
    "stroopwafel": "\uf551",
    "studiovinari": "\uf3f8",
    "stumbleupon": "\uf1a4",
    "stumbleupon-circle": "\uf1a3",
    "subscript": "\uf12c",
    "suitcase": "\uf0f2",
    "suitcase-medical": "\uf0fa",
    "suitcase-rolling": "\uf5c1",
    "sun": "\uf185",
    "sun-plant-wilt": "\ue57a",
    "superpowers": "\uf2dd",
    "superscript": "\uf12b",
    "supple": "\uf3f9",
    "suse": "\uf7d6",
    "swatchbook": "\uf5c3",
    "swift": "\uf8e1",
    "symfony": "\uf83d",
    "synagogue": "\uf69b",
    "syringe": "\uf48e",
    "t": "\\u54",
    "table": "\uf0ce",
    "table-cells": "\uf00a",
    "table-cells-large": "\uf009",
    "table-columns": "\uf0db",
    "table-list": "\uf00b",
    "table-tennis-paddle-ball": "\uf45d",
    "tablet": "\uf3fb",
    "tablet-button": "\uf10a",
    "tablet-screen-button": "\uf3fa",
    "tablets": "\uf490",
    "tachograph-digital": "\uf566",
    "tag": "\uf02b",
    "tags": "\uf02c",
    "tape": "\uf4db",
    "tarp": "\ue57b",
    "tarp-droplet": "\ue57c",
    "taxi": "\uf1ba",
    "teamspeak": "\uf4f9",
    "teeth": "\uf62e",
    "teeth-open": "\uf62f",
    "telegram": "\uf2c6",
    "temperature-arrow-down": "\ue03f",
    "temperature-arrow-up": "\ue040",
    "temperature-empty": "\uf2cb",
    "temperature-full": "\uf2c7",
    "temperature-half": "\uf2c9",
    "temperature-high": "\uf769",
    "temperature-low": "\uf76b",
    "temperature-quarter": "\uf2ca",
    "temperature-three-quarters": "\uf2c8",
    "tencent-weibo": "\uf1d5",
    "tenge-sign": "\uf7d7",
    "tent": "\ue57d",
    "tent-arrow-down-to-line": "\ue57e",
    "tent-arrow-left-right": "\ue57f",
    "tent-arrow-turn-left": "\ue580",
    "tent-arrows-down": "\ue581",
    "tents": "\ue582",
    "terminal": "\uf120",
    "text-height": "\uf034",
    "text-slash": "\uf87d",
    "text-width": "\uf035",
    "the-red-yeti": "\uf69d",
    "themeco": "\uf5c6",
    "themeisle": "\uf2b2",
    "thermometer": "\uf491",
    "think-peaks": "\uf731",
    "thumbs-down": "\uf165",
    "thumbs-up": "\uf164",
    "thumbtack": "\uf08d",
    "ticket": "\uf145",
    "ticket-simple": "\uf3ff",
    "tiktok": "\ue07b",
    "timeline": "\ue29c",
    "toggle-off": "\uf204",
    "toggle-on": "\uf205",
    "toilet": "\uf7d8",
    "toilet-paper": "\uf71e",
    "toilet-paper-slash": "\ue072",
    "toilet-portable": "\ue583",
    "toilets-portable": "\ue584",
    "toolbox": "\uf552",
    "tooth": "\uf5c9",
    "torii-gate": "\uf6a1",
    "tornado": "\uf76f",
    "tower-broadcast": "\uf519",
    "tower-cell": "\ue585",
    "tower-observation": "\ue586",
    "tractor": "\uf722",
    "trade-federation": "\uf513",
    "trademark": "\uf25c",
    "traffic-light": "\uf637",
    "trailer": "\ue041",
    "train": "\uf238",
    "train-subway": "\uf239",
    "train-tram": "\uf7da",
    "transgender": "\uf225",
    "trash": "\uf1f8",
    "trash-arrow-up": "\uf829",
    "trash-can": "\uf2ed",
    "trash-can-arrow-up": "\uf82a",
    "tree": "\uf1bb",
    "tree-city": "\ue587",
    "trello": "\uf181",
    "triangle-exclamation": "\uf071",
    "trophy": "\uf091",
    "trowel": "\ue589",
    "trowel-bricks": "\ue58a",
    "truck": "\uf0d1",
    "truck-arrow-right": "\ue58b",
    "truck-droplet": "\ue58c",
    "truck-fast": "\uf48b",
    "truck-field": "\ue58d",
    "truck-field-un": "\ue58e",
    "truck-front": "\ue2b7",
    "truck-medical": "\uf0f9",
    "truck-monster": "\uf63b",
    "truck-moving": "\uf4df",
    "truck-pickup": "\uf63c",
    "truck-plane": "\ue58f",
    "truck-ramp-box": "\uf4de",
    "tty": "\uf1e4",
    "tumblr": "\uf173",
    "tumblr-square": "\uf174",
    "turkish-lira-sign": "\ue2bb",
    "turn-down": "\uf3be",
    "turn-up": "\uf3bf",
    "tv": "\uf26c",
    "twitch": "\uf1e8",
    "twitter": "\uf099",
    "twitter-square": "\uf081",
    "typo3": "\uf42b",
    "u": "\\u55",
    "uber": "\uf402",
    "ubuntu": "\uf7df",
    "uikit": "\uf403",
    "umbraco": "\uf8e8",
    "umbrella": "\uf0e9",
    "umbrella-beach": "\uf5ca",
    "uncharted": "\ue084",
    "underline": "\uf0cd",
    "uniregistry": "\uf404",
    "unity": "\ue049",
    "universal-access": "\uf29a",
    "unlock": "\uf09c",
    "unlock-keyhole": "\uf13e",
    "unsplash": "\ue07c",
    "untappd": "\uf405",
    "up-down": "\uf338",
    "up-down-left-right": "\uf0b2",
    "up-long": "\uf30c",
    "up-right-and-down-left-from-center": "\uf424",
    "up-right-from-square": "\uf35d",
    "upload": "\uf093",
    "ups": "\uf7e0",
    "usb": "\uf287",
    "user": "\uf007",
    "user-astronaut": "\uf4fb",
    "user-check": "\uf4fc",
    "user-clock": "\uf4fd",
    "user-doctor": "\uf0f0",
    "user-gear": "\uf4fe",
    "user-graduate": "\uf501",
    "user-group": "\uf500",
    "user-injured": "\uf728",
    "user-large": "\uf406",
    "user-large-slash": "\uf4fa",
    "user-lock": "\uf502",
    "user-minus": "\uf503",
    "user-ninja": "\uf504",
    "user-nurse": "\uf82f",
    "user-pen": "\uf4ff",
    "user-plus": "\uf234",
    "user-secret": "\uf21b",
    "user-shield": "\uf505",
    "user-slash": "\uf506",
    "user-tag": "\uf507",
    "user-tie": "\uf508",
    "user-xmark": "\uf235",
    "users": "\uf0c0",
    "users-between-lines": "\ue591",
    "users-gear": "\uf509",
    "users-line": "\ue592",
    "users-rays": "\ue593",
    "users-rectangle": "\ue594",
    "users-slash": "\ue073",
    "users-viewfinder": "\ue595",
    "usps": "\uf7e1",
    "ussunnah": "\uf407",
    "utensils": "\uf2e7",
    "v": "\\u56",
    "vaadin": "\uf408",
    "van-shuttle": "\uf5b6",
    "vault": "\ue2c5",
    "vector-square": "\uf5cb",
    "venus": "\uf221",
    "venus-double": "\uf226",
    "venus-mars": "\uf228",
    "vest": "\ue085",
    "vest-patches": "\ue086",
    "viacoin": "\uf237",
    "viadeo": "\uf2a9",
    "viadeo-square": "\uf2aa",
    "vial": "\uf492",
    "vial-circle-check": "\ue596",
    "vial-virus": "\ue597",
    "vials": "\uf493",
    "viber": "\uf409",
    "video": "\uf03d",
    "video-slash": "\uf4e2",
    "vihara": "\uf6a7",
    "vimeo": "\uf40a",
    "vimeo-square": "\uf194",
    "vimeo-v": "\uf27d",
    "vine": "\uf1ca",
    "virus": "\ue074",
    "virus-covid": "\ue4a8",
    "virus-covid-slash": "\ue4a9",
    "virus-slash": "\ue075",
    "viruses": "\ue076",
    "vk": "\uf189",
    "vnv": "\uf40b",
    "voicemail": "\uf897",
    "volcano": "\uf770",
    "volleyball": "\uf45f",
    "volume-high": "\uf028",
    "volume-low": "\uf027",
    "volume-off": "\uf026",
    "volume-xmark": "\uf6a9",
    "vr-cardboard": "\uf729",
    "vuejs": "\uf41f",
    "w": "\\u57",
    "walkie-talkie": "\uf8ef",
    "wallet": "\uf555",
    "wand-magic": "\uf0d0",
    "wand-magic-sparkles": "\ue2ca",
    "wand-sparkles": "\uf72b",
    "warehouse": "\uf494",
    "watchman-monitoring": "\ue087",
    "water": "\uf773",
    "water-ladder": "\uf5c5",
    "wave-square": "\uf83e",
    "waze": "\uf83f",
    "weebly": "\uf5cc",
    "weibo": "\uf18a",
    "weight-hanging": "\uf5cd",
    "weight-scale": "\uf496",
    "weixin": "\uf1d7",
    "whatsapp": "\uf232",
    "whatsapp-square": "\uf40c",
    "wheat-awn": "\ue2cd",
    "wheat-awn-circle-exclamation": "\ue598",
    "wheelchair": "\uf193",
    "wheelchair-move": "\ue2ce",
    "whiskey-glass": "\uf7a0",
    "whmcs": "\uf40d",
    "wifi": "\uf1eb",
    "wikipedia-w": "\uf266",
    "wind": "\uf72e",
    "window-maximize": "\uf2d0",
    "window-minimize": "\uf2d1",
    "window-restore": "\uf2d2",
    "windows": "\uf17a",
    "wine-bottle": "\uf72f",
    "wine-glass": "\uf4e3",
    "wine-glass-empty": "\uf5ce",
    "wirsindhandwerk": "\ue2d0",
    "wix": "\uf5cf",
    "wizards-of-the-coast": "\uf730",
    "wodu": "\ue088",
    "wolf-pack-battalion": "\uf514",
    "won-sign": "\uf159",
    "wordpress": "\uf19a",
    "wordpress-simple": "\uf411",
    "worm": "\ue599",
    "wpbeginner": "\uf297",
    "wpexplorer": "\uf2de",
    "wpforms": "\uf298",
    "wpressr": "\uf3e4",
    "wrench": "\uf0ad",
    "x": "\\u58",
    "x-ray": "\uf497",
    "xbox": "\uf412",
    "xing": "\uf168",
    "xing-square": "\uf169",
    "xmark": "\uf00d",
    "xmarks-lines": "\ue59a",
    "y": "\\u59",
    "y-combinator": "\uf23b",
    "yahoo": "\uf19e",
    "yammer": "\uf840",
    "yandex": "\uf413",
    "yandex-international": "\uf414",
    "yarn": "\uf7e3",
    "yelp": "\uf1e9",
    "yen-sign": "\uf157",
    "yin-yang": "\uf6ad",
    "yoast": "\uf2b1",
    "youtube": "\uf167",
    "youtube-square": "\uf431",
    "z": "\\u5a",
    "zhihu": "\uf63f"
}

var bs_unicode_map = {
    "bi-123": "\uf67f",
    "bi-alarm-fill": "\uf101",
    "bi-alarm": "\uf102",
    "bi-align-bottom": "\uf103",
    "bi-align-center": "\uf104",
    "bi-align-end": "\uf105",
    "bi-align-middle": "\uf106",
    "bi-align-start": "\uf107",
    "bi-align-top": "\uf108",
    "bi-alt": "\uf109",
    "bi-app-indicator": "\uf10a",
    "bi-app": "\uf10b",
    "bi-archive-fill": "\uf10c",
    "bi-archive": "\uf10d",
    "bi-arrow-90deg-down": "\uf10e",
    "bi-arrow-90deg-left": "\uf10f",
    "bi-arrow-90deg-right": "\uf110",
    "bi-arrow-90deg-up": "\uf111",
    "bi-arrow-bar-down": "\uf112",
    "bi-arrow-bar-left": "\uf113",
    "bi-arrow-bar-right": "\uf114",
    "bi-arrow-bar-up": "\uf115",
    "bi-arrow-clockwise": "\uf116",
    "bi-arrow-counterclockwise": "\uf117",
    "bi-arrow-down-circle-fill": "\uf118",
    "bi-arrow-down-circle": "\uf119",
    "bi-arrow-down-left-circle-fill": "\uf11a",
    "bi-arrow-down-left-circle": "\uf11b",
    "bi-arrow-down-left-square-fill": "\uf11c",
    "bi-arrow-down-left-square": "\uf11d",
    "bi-arrow-down-left": "\uf11e",
    "bi-arrow-down-right-circle-fill": "\uf11f",
    "bi-arrow-down-right-circle": "\uf120",
    "bi-arrow-down-right-square-fill": "\uf121",
    "bi-arrow-down-right-square": "\uf122",
    "bi-arrow-down-right": "\uf123",
    "bi-arrow-down-short": "\uf124",
    "bi-arrow-down-square-fill": "\uf125",
    "bi-arrow-down-square": "\uf126",
    "bi-arrow-down-up": "\uf127",
    "bi-arrow-down": "\uf128",
    "bi-arrow-left-circle-fill": "\uf129",
    "bi-arrow-left-circle": "\uf12a",
    "bi-arrow-left-right": "\uf12b",
    "bi-arrow-left-short": "\uf12c",
    "bi-arrow-left-square-fill": "\uf12d",
    "bi-arrow-left-square": "\uf12e",
    "bi-arrow-left": "\uf12f",
    "bi-arrow-repeat": "\uf130",
    "bi-arrow-return-left": "\uf131",
    "bi-arrow-return-right": "\uf132",
    "bi-arrow-right-circle-fill": "\uf133",
    "bi-arrow-right-circle": "\uf134",
    "bi-arrow-right-short": "\uf135",
    "bi-arrow-right-square-fill": "\uf136",
    "bi-arrow-right-square": "\uf137",
    "bi-arrow-right": "\uf138",
    "bi-arrow-up-circle-fill": "\uf139",
    "bi-arrow-up-circle": "\uf13a",
    "bi-arrow-up-left-circle-fill": "\uf13b",
    "bi-arrow-up-left-circle": "\uf13c",
    "bi-arrow-up-left-square-fill": "\uf13d",
    "bi-arrow-up-left-square": "\uf13e",
    "bi-arrow-up-left": "\uf13f",
    "bi-arrow-up-right-circle-fill": "\uf140",
    "bi-arrow-up-right-circle": "\uf141",
    "bi-arrow-up-right-square-fill": "\uf142",
    "bi-arrow-up-right-square": "\uf143",
    "bi-arrow-up-right": "\uf144",
    "bi-arrow-up-short": "\uf145",
    "bi-arrow-up-square-fill": "\uf146",
    "bi-arrow-up-square": "\uf147",
    "bi-arrow-up": "\uf148",
    "bi-arrows-angle-contract": "\uf149",
    "bi-arrows-angle-expand": "\uf14a",
    "bi-arrows-collapse": "\uf14b",
    "bi-arrows-expand": "\uf14c",
    "bi-arrows-fullscreen": "\uf14d",
    "bi-arrows-move": "\uf14e",
    "bi-aspect-ratio-fill": "\uf14f",
    "bi-aspect-ratio": "\uf150",
    "bi-asterisk": "\uf151",
    "bi-at": "\uf152",
    "bi-award-fill": "\uf153",
    "bi-award": "\uf154",
    "bi-back": "\uf155",
    "bi-backspace-fill": "\uf156",
    "bi-backspace-reverse-fill": "\uf157",
    "bi-backspace-reverse": "\uf158",
    "bi-backspace": "\uf159",
    "bi-badge-3d-fill": "\uf15a",
    "bi-badge-3d": "\uf15b",
    "bi-badge-4k-fill": "\uf15c",
    "bi-badge-4k": "\uf15d",
    "bi-badge-8k-fill": "\uf15e",
    "bi-badge-8k": "\uf15f",
    "bi-badge-ad-fill": "\uf160",
    "bi-badge-ad": "\uf161",
    "bi-badge-ar-fill": "\uf162",
    "bi-badge-ar": "\uf163",
    "bi-badge-cc-fill": "\uf164",
    "bi-badge-cc": "\uf165",
    "bi-badge-hd-fill": "\uf166",
    "bi-badge-hd": "\uf167",
    "bi-badge-tm-fill": "\uf168",
    "bi-badge-tm": "\uf169",
    "bi-badge-vo-fill": "\uf16a",
    "bi-badge-vo": "\uf16b",
    "bi-badge-vr-fill": "\uf16c",
    "bi-badge-vr": "\uf16d",
    "bi-badge-wc-fill": "\uf16e",
    "bi-badge-wc": "\uf16f",
    "bi-bag-check-fill": "\uf170",
    "bi-bag-check": "\uf171",
    "bi-bag-dash-fill": "\uf172",
    "bi-bag-dash": "\uf173",
    "bi-bag-fill": "\uf174",
    "bi-bag-plus-fill": "\uf175",
    "bi-bag-plus": "\uf176",
    "bi-bag-x-fill": "\uf177",
    "bi-bag-x": "\uf178",
    "bi-bag": "\uf179",
    "bi-bar-chart-fill": "\uf17a",
    "bi-bar-chart-line-fill": "\uf17b",
    "bi-bar-chart-line": "\uf17c",
    "bi-bar-chart-steps": "\uf17d",
    "bi-bar-chart": "\uf17e",
    "bi-basket-fill": "\uf17f",
    "bi-basket": "\uf180",
    "bi-basket2-fill": "\uf181",
    "bi-basket2": "\uf182",
    "bi-basket3-fill": "\uf183",
    "bi-basket3": "\uf184",
    "bi-battery-charging": "\uf185",
    "bi-battery-full": "\uf186",
    "bi-battery-half": "\uf187",
    "bi-battery": "\uf188",
    "bi-bell-fill": "\uf189",
    "bi-bell": "\uf18a",
    "bi-bezier": "\uf18b",
    "bi-bezier2": "\uf18c",
    "bi-bicycle": "\uf18d",
    "bi-binoculars-fill": "\uf18e",
    "bi-binoculars": "\uf18f",
    "bi-blockquote-left": "\uf190",
    "bi-blockquote-right": "\uf191",
    "bi-book-fill": "\uf192",
    "bi-book-half": "\uf193",
    "bi-book": "\uf194",
    "bi-bookmark-check-fill": "\uf195",
    "bi-bookmark-check": "\uf196",
    "bi-bookmark-dash-fill": "\uf197",
    "bi-bookmark-dash": "\uf198",
    "bi-bookmark-fill": "\uf199",
    "bi-bookmark-heart-fill": "\uf19a",
    "bi-bookmark-heart": "\uf19b",
    "bi-bookmark-plus-fill": "\uf19c",
    "bi-bookmark-plus": "\uf19d",
    "bi-bookmark-star-fill": "\uf19e",
    "bi-bookmark-star": "\uf19f",
    "bi-bookmark-x-fill": "\uf1a0",
    "bi-bookmark-x": "\uf1a1",
    "bi-bookmark": "\uf1a2",
    "bi-bookmarks-fill": "\uf1a3",
    "bi-bookmarks": "\uf1a4",
    "bi-bookshelf": "\uf1a5",
    "bi-bootstrap-fill": "\uf1a6",
    "bi-bootstrap-reboot": "\uf1a7",
    "bi-bootstrap": "\uf1a8",
    "bi-border-all": "\uf1a9",
    "bi-border-bottom": "\uf1aa",
    "bi-border-center": "\uf1ab",
    "bi-border-inner": "\uf1ac",
    "bi-border-left": "\uf1ad",
    "bi-border-middle": "\uf1ae",
    "bi-border-outer": "\uf1af",
    "bi-border-right": "\uf1b0",
    "bi-border-style": "\uf1b1",
    "bi-border-top": "\uf1b2",
    "bi-border-width": "\uf1b3",
    "bi-border": "\uf1b4",
    "bi-bounding-box-circles": "\uf1b5",
    "bi-bounding-box": "\uf1b6",
    "bi-box-arrow-down-left": "\uf1b7",
    "bi-box-arrow-down-right": "\uf1b8",
    "bi-box-arrow-down": "\uf1b9",
    "bi-box-arrow-in-down-left": "\uf1ba",
    "bi-box-arrow-in-down-right": "\uf1bb",
    "bi-box-arrow-in-down": "\uf1bc",
    "bi-box-arrow-in-left": "\uf1bd",
    "bi-box-arrow-in-right": "\uf1be",
    "bi-box-arrow-in-up-left": "\uf1bf",
    "bi-box-arrow-in-up-right": "\uf1c0",
    "bi-box-arrow-in-up": "\uf1c1",
    "bi-box-arrow-left": "\uf1c2",
    "bi-box-arrow-right": "\uf1c3",
    "bi-box-arrow-up-left": "\uf1c4",
    "bi-box-arrow-up-right": "\uf1c5",
    "bi-box-arrow-up": "\uf1c6",
    "bi-box-seam": "\uf1c7",
    "bi-box": "\uf1c8",
    "bi-braces": "\uf1c9",
    "bi-bricks": "\uf1ca",
    "bi-briefcase-fill": "\uf1cb",
    "bi-briefcase": "\uf1cc",
    "bi-brightness-alt-high-fill": "\uf1cd",
    "bi-brightness-alt-high": "\uf1ce",
    "bi-brightness-alt-low-fill": "\uf1cf",
    "bi-brightness-alt-low": "\uf1d0",
    "bi-brightness-high-fill": "\uf1d1",
    "bi-brightness-high": "\uf1d2",
    "bi-brightness-low-fill": "\uf1d3",
    "bi-brightness-low": "\uf1d4",
    "bi-broadcast-pin": "\uf1d5",
    "bi-broadcast": "\uf1d6",
    "bi-brush-fill": "\uf1d7",
    "bi-brush": "\uf1d8",
    "bi-bucket-fill": "\uf1d9",
    "bi-bucket": "\uf1da",
    "bi-bug-fill": "\uf1db",
    "bi-bug": "\uf1dc",
    "bi-building": "\uf1dd",
    "bi-bullseye": "\uf1de",
    "bi-calculator-fill": "\uf1df",
    "bi-calculator": "\uf1e0",
    "bi-calendar-check-fill": "\uf1e1",
    "bi-calendar-check": "\uf1e2",
    "bi-calendar-date-fill": "\uf1e3",
    "bi-calendar-date": "\uf1e4",
    "bi-calendar-day-fill": "\uf1e5",
    "bi-calendar-day": "\uf1e6",
    "bi-calendar-event-fill": "\uf1e7",
    "bi-calendar-event": "\uf1e8",
    "bi-calendar-fill": "\uf1e9",
    "bi-calendar-minus-fill": "\uf1ea",
    "bi-calendar-minus": "\uf1eb",
    "bi-calendar-month-fill": "\uf1ec",
    "bi-calendar-month": "\uf1ed",
    "bi-calendar-plus-fill": "\uf1ee",
    "bi-calendar-plus": "\uf1ef",
    "bi-calendar-range-fill": "\uf1f0",
    "bi-calendar-range": "\uf1f1",
    "bi-calendar-week-fill": "\uf1f2",
    "bi-calendar-week": "\uf1f3",
    "bi-calendar-x-fill": "\uf1f4",
    "bi-calendar-x": "\uf1f5",
    "bi-calendar": "\uf1f6",
    "bi-calendar2-check-fill": "\uf1f7",
    "bi-calendar2-check": "\uf1f8",
    "bi-calendar2-date-fill": "\uf1f9",
    "bi-calendar2-date": "\uf1fa",
    "bi-calendar2-day-fill": "\uf1fb",
    "bi-calendar2-day": "\uf1fc",
    "bi-calendar2-event-fill": "\uf1fd",
    "bi-calendar2-event": "\uf1fe",
    "bi-calendar2-fill": "\uf1ff",
    "bi-calendar2-minus-fill": "\uf200",
    "bi-calendar2-minus": "\uf201",
    "bi-calendar2-month-fill": "\uf202",
    "bi-calendar2-month": "\uf203",
    "bi-calendar2-plus-fill": "\uf204",
    "bi-calendar2-plus": "\uf205",
    "bi-calendar2-range-fill": "\uf206",
    "bi-calendar2-range": "\uf207",
    "bi-calendar2-week-fill": "\uf208",
    "bi-calendar2-week": "\uf209",
    "bi-calendar2-x-fill": "\uf20a",
    "bi-calendar2-x": "\uf20b",
    "bi-calendar2": "\uf20c",
    "bi-calendar3-event-fill": "\uf20d",
    "bi-calendar3-event": "\uf20e",
    "bi-calendar3-fill": "\uf20f",
    "bi-calendar3-range-fill": "\uf210",
    "bi-calendar3-range": "\uf211",
    "bi-calendar3-week-fill": "\uf212",
    "bi-calendar3-week": "\uf213",
    "bi-calendar3": "\uf214",
    "bi-calendar4-event": "\uf215",
    "bi-calendar4-range": "\uf216",
    "bi-calendar4-week": "\uf217",
    "bi-calendar4": "\uf218",
    "bi-camera-fill": "\uf219",
    "bi-camera-reels-fill": "\uf21a",
    "bi-camera-reels": "\uf21b",
    "bi-camera-video-fill": "\uf21c",
    "bi-camera-video-off-fill": "\uf21d",
    "bi-camera-video-off": "\uf21e",
    "bi-camera-video": "\uf21f",
    "bi-camera": "\uf220",
    "bi-camera2": "\uf221",
    "bi-capslock-fill": "\uf222",
    "bi-capslock": "\uf223",
    "bi-card-checklist": "\uf224",
    "bi-card-heading": "\uf225",
    "bi-card-image": "\uf226",
    "bi-card-list": "\uf227",
    "bi-card-text": "\uf228",
    "bi-caret-down-fill": "\uf229",
    "bi-caret-down-square-fill": "\uf22a",
    "bi-caret-down-square": "\uf22b",
    "bi-caret-down": "\uf22c",
    "bi-caret-left-fill": "\uf22d",
    "bi-caret-left-square-fill": "\uf22e",
    "bi-caret-left-square": "\uf22f",
    "bi-caret-left": "\uf230",
    "bi-caret-right-fill": "\uf231",
    "bi-caret-right-square-fill": "\uf232",
    "bi-caret-right-square": "\uf233",
    "bi-caret-right": "\uf234",
    "bi-caret-up-fill": "\uf235",
    "bi-caret-up-square-fill": "\uf236",
    "bi-caret-up-square": "\uf237",
    "bi-caret-up": "\uf238",
    "bi-cart-check-fill": "\uf239",
    "bi-cart-check": "\uf23a",
    "bi-cart-dash-fill": "\uf23b",
    "bi-cart-dash": "\uf23c",
    "bi-cart-fill": "\uf23d",
    "bi-cart-plus-fill": "\uf23e",
    "bi-cart-plus": "\uf23f",
    "bi-cart-x-fill": "\uf240",
    "bi-cart-x": "\uf241",
    "bi-cart": "\uf242",
    "bi-cart2": "\uf243",
    "bi-cart3": "\uf244",
    "bi-cart4": "\uf245",
    "bi-cash-stack": "\uf246",
    "bi-cash": "\uf247",
    "bi-cast": "\uf248",
    "bi-chat-dots-fill": "\uf249",
    "bi-chat-dots": "\uf24a",
    "bi-chat-fill": "\uf24b",
    "bi-chat-left-dots-fill": "\uf24c",
    "bi-chat-left-dots": "\uf24d",
    "bi-chat-left-fill": "\uf24e",
    "bi-chat-left-quote-fill": "\uf24f",
    "bi-chat-left-quote": "\uf250",
    "bi-chat-left-text-fill": "\uf251",
    "bi-chat-left-text": "\uf252",
    "bi-chat-left": "\uf253",
    "bi-chat-quote-fill": "\uf254",
    "bi-chat-quote": "\uf255",
    "bi-chat-right-dots-fill": "\uf256",
    "bi-chat-right-dots": "\uf257",
    "bi-chat-right-fill": "\uf258",
    "bi-chat-right-quote-fill": "\uf259",
    "bi-chat-right-quote": "\uf25a",
    "bi-chat-right-text-fill": "\uf25b",
    "bi-chat-right-text": "\uf25c",
    "bi-chat-right": "\uf25d",
    "bi-chat-square-dots-fill": "\uf25e",
    "bi-chat-square-dots": "\uf25f",
    "bi-chat-square-fill": "\uf260",
    "bi-chat-square-quote-fill": "\uf261",
    "bi-chat-square-quote": "\uf262",
    "bi-chat-square-text-fill": "\uf263",
    "bi-chat-square-text": "\uf264",
    "bi-chat-square": "\uf265",
    "bi-chat-text-fill": "\uf266",
    "bi-chat-text": "\uf267",
    "bi-chat": "\uf268",
    "bi-check-all": "\uf269",
    "bi-check-circle-fill": "\uf26a",
    "bi-check-circle": "\uf26b",
    "bi-check-square-fill": "\uf26c",
    "bi-check-square": "\uf26d",
    "bi-check": "\uf26e",
    "bi-check2-all": "\uf26f",
    "bi-check2-circle": "\uf270",
    "bi-check2-square": "\uf271",
    "bi-check2": "\uf272",
    "bi-chevron-bar-contract": "\uf273",
    "bi-chevron-bar-down": "\uf274",
    "bi-chevron-bar-expand": "\uf275",
    "bi-chevron-bar-left": "\uf276",
    "bi-chevron-bar-right": "\uf277",
    "bi-chevron-bar-up": "\uf278",
    "bi-chevron-compact-down": "\uf279",
    "bi-chevron-compact-left": "\uf27a",
    "bi-chevron-compact-right": "\uf27b",
    "bi-chevron-compact-up": "\uf27c",
    "bi-chevron-contract": "\uf27d",
    "bi-chevron-double-down": "\uf27e",
    "bi-chevron-double-left": "\uf27f",
    "bi-chevron-double-right": "\uf280",
    "bi-chevron-double-up": "\uf281",
    "bi-chevron-down": "\uf282",
    "bi-chevron-expand": "\uf283",
    "bi-chevron-left": "\uf284",
    "bi-chevron-right": "\uf285",
    "bi-chevron-up": "\uf286",
    "bi-circle-fill": "\uf287",
    "bi-circle-half": "\uf288",
    "bi-circle-square": "\uf289",
    "bi-circle": "\uf28a",
    "bi-clipboard-check": "\uf28b",
    "bi-clipboard-data": "\uf28c",
    "bi-clipboard-minus": "\uf28d",
    "bi-clipboard-plus": "\uf28e",
    "bi-clipboard-x": "\uf28f",
    "bi-clipboard": "\uf290",
    "bi-clock-fill": "\uf291",
    "bi-clock-history": "\uf292",
    "bi-clock": "\uf293",
    "bi-cloud-arrow-down-fill": "\uf294",
    "bi-cloud-arrow-down": "\uf295",
    "bi-cloud-arrow-up-fill": "\uf296",
    "bi-cloud-arrow-up": "\uf297",
    "bi-cloud-check-fill": "\uf298",
    "bi-cloud-check": "\uf299",
    "bi-cloud-download-fill": "\uf29a",
    "bi-cloud-download": "\uf29b",
    "bi-cloud-drizzle-fill": "\uf29c",
    "bi-cloud-drizzle": "\uf29d",
    "bi-cloud-fill": "\uf29e",
    "bi-cloud-fog-fill": "\uf29f",
    "bi-cloud-fog": "\uf2a0",
    "bi-cloud-fog2-fill": "\uf2a1",
    "bi-cloud-fog2": "\uf2a2",
    "bi-cloud-hail-fill": "\uf2a3",
    "bi-cloud-hail": "\uf2a4",
    "bi-cloud-haze-1": "\uf2a5",
    "bi-cloud-haze-fill": "\uf2a6",
    "bi-cloud-haze": "\uf2a7",
    "bi-cloud-haze2-fill": "\uf2a8",
    "bi-cloud-lightning-fill": "\uf2a9",
    "bi-cloud-lightning-rain-fill": "\uf2aa",
    "bi-cloud-lightning-rain": "\uf2ab",
    "bi-cloud-lightning": "\uf2ac",
    "bi-cloud-minus-fill": "\uf2ad",
    "bi-cloud-minus": "\uf2ae",
    "bi-cloud-moon-fill": "\uf2af",
    "bi-cloud-moon": "\uf2b0",
    "bi-cloud-plus-fill": "\uf2b1",
    "bi-cloud-plus": "\uf2b2",
    "bi-cloud-rain-fill": "\uf2b3",
    "bi-cloud-rain-heavy-fill": "\uf2b4",
    "bi-cloud-rain-heavy": "\uf2b5",
    "bi-cloud-rain": "\uf2b6",
    "bi-cloud-slash-fill": "\uf2b7",
    "bi-cloud-slash": "\uf2b8",
    "bi-cloud-sleet-fill": "\uf2b9",
    "bi-cloud-sleet": "\uf2ba",
    "bi-cloud-snow-fill": "\uf2bb",
    "bi-cloud-snow": "\uf2bc",
    "bi-cloud-sun-fill": "\uf2bd",
    "bi-cloud-sun": "\uf2be",
    "bi-cloud-upload-fill": "\uf2bf",
    "bi-cloud-upload": "\uf2c0",
    "bi-cloud": "\uf2c1",
    "bi-clouds-fill": "\uf2c2",
    "bi-clouds": "\uf2c3",
    "bi-cloudy-fill": "\uf2c4",
    "bi-cloudy": "\uf2c5",
    "bi-code-slash": "\uf2c6",
    "bi-code-square": "\uf2c7",
    "bi-code": "\uf2c8",
    "bi-collection-fill": "\uf2c9",
    "bi-collection-play-fill": "\uf2ca",
    "bi-collection-play": "\uf2cb",
    "bi-collection": "\uf2cc",
    "bi-columns-gap": "\uf2cd",
    "bi-columns": "\uf2ce",
    "bi-command": "\uf2cf",
    "bi-compass-fill": "\uf2d0",
    "bi-compass": "\uf2d1",
    "bi-cone-striped": "\uf2d2",
    "bi-cone": "\uf2d3",
    "bi-controller": "\uf2d4",
    "bi-cpu-fill": "\uf2d5",
    "bi-cpu": "\uf2d6",
    "bi-credit-card-2-back-fill": "\uf2d7",
    "bi-credit-card-2-back": "\uf2d8",
    "bi-credit-card-2-front-fill": "\uf2d9",
    "bi-credit-card-2-front": "\uf2da",
    "bi-credit-card-fill": "\uf2db",
    "bi-credit-card": "\uf2dc",
    "bi-crop": "\uf2dd",
    "bi-cup-fill": "\uf2de",
    "bi-cup-straw": "\uf2df",
    "bi-cup": "\uf2e0",
    "bi-cursor-fill": "\uf2e1",
    "bi-cursor-text": "\uf2e2",
    "bi-cursor": "\uf2e3",
    "bi-dash-circle-dotted": "\uf2e4",
    "bi-dash-circle-fill": "\uf2e5",
    "bi-dash-circle": "\uf2e6",
    "bi-dash-square-dotted": "\uf2e7",
    "bi-dash-square-fill": "\uf2e8",
    "bi-dash-square": "\uf2e9",
    "bi-dash": "\uf2ea",
    "bi-diagram-2-fill": "\uf2eb",
    "bi-diagram-2": "\uf2ec",
    "bi-diagram-3-fill": "\uf2ed",
    "bi-diagram-3": "\uf2ee",
    "bi-diamond-fill": "\uf2ef",
    "bi-diamond-half": "\uf2f0",
    "bi-diamond": "\uf2f1",
    "bi-dice-1-fill": "\uf2f2",
    "bi-dice-1": "\uf2f3",
    "bi-dice-2-fill": "\uf2f4",
    "bi-dice-2": "\uf2f5",
    "bi-dice-3-fill": "\uf2f6",
    "bi-dice-3": "\uf2f7",
    "bi-dice-4-fill": "\uf2f8",
    "bi-dice-4": "\uf2f9",
    "bi-dice-5-fill": "\uf2fa",
    "bi-dice-5": "\uf2fb",
    "bi-dice-6-fill": "\uf2fc",
    "bi-dice-6": "\uf2fd",
    "bi-disc-fill": "\uf2fe",
    "bi-disc": "\uf2ff",
    "bi-discord": "\uf300",
    "bi-display-fill": "\uf301",
    "bi-display": "\uf302",
    "bi-distribute-horizontal": "\uf303",
    "bi-distribute-vertical": "\uf304",
    "bi-door-closed-fill": "\uf305",
    "bi-door-closed": "\uf306",
    "bi-door-open-fill": "\uf307",
    "bi-door-open": "\uf308",
    "bi-dot": "\uf309",
    "bi-download": "\uf30a",
    "bi-droplet-fill": "\uf30b",
    "bi-droplet-half": "\uf30c",
    "bi-droplet": "\uf30d",
    "bi-earbuds": "\uf30e",
    "bi-easel-fill": "\uf30f",
    "bi-easel": "\uf310",
    "bi-egg-fill": "\uf311",
    "bi-egg-fried": "\uf312",
    "bi-egg": "\uf313",
    "bi-eject-fill": "\uf314",
    "bi-eject": "\uf315",
    "bi-emoji-angry-fill": "\uf316",
    "bi-emoji-angry": "\uf317",
    "bi-emoji-dizzy-fill": "\uf318",
    "bi-emoji-dizzy": "\uf319",
    "bi-emoji-expressionless-fill": "\uf31a",
    "bi-emoji-expressionless": "\uf31b",
    "bi-emoji-frown-fill": "\uf31c",
    "bi-emoji-frown": "\uf31d",
    "bi-emoji-heart-eyes-fill": "\uf31e",
    "bi-emoji-heart-eyes": "\uf31f",
    "bi-emoji-laughing-fill": "\uf320",
    "bi-emoji-laughing": "\uf321",
    "bi-emoji-neutral-fill": "\uf322",
    "bi-emoji-neutral": "\uf323",
    "bi-emoji-smile-fill": "\uf324",
    "bi-emoji-smile-upside-down-fill": "\uf325",
    "bi-emoji-smile-upside-down": "\uf326",
    "bi-emoji-smile": "\uf327",
    "bi-emoji-sunglasses-fill": "\uf328",
    "bi-emoji-sunglasses": "\uf329",
    "bi-emoji-wink-fill": "\uf32a",
    "bi-emoji-wink": "\uf32b",
    "bi-envelope-fill": "\uf32c",
    "bi-envelope-open-fill": "\uf32d",
    "bi-envelope-open": "\uf32e",
    "bi-envelope": "\uf32f",
    "bi-eraser-fill": "\uf330",
    "bi-eraser": "\uf331",
    "bi-exclamation-circle-fill": "\uf332",
    "bi-exclamation-circle": "\uf333",
    "bi-exclamation-diamond-fill": "\uf334",
    "bi-exclamation-diamond": "\uf335",
    "bi-exclamation-octagon-fill": "\uf336",
    "bi-exclamation-octagon": "\uf337",
    "bi-exclamation-square-fill": "\uf338",
    "bi-exclamation-square": "\uf339",
    "bi-exclamation-triangle-fill": "\uf33a",
    "bi-exclamation-triangle": "\uf33b",
    "bi-exclamation": "\uf33c",
    "bi-exclude": "\uf33d",
    "bi-eye-fill": "\uf33e",
    "bi-eye-slash-fill": "\uf33f",
    "bi-eye-slash": "\uf340",
    "bi-eye": "\uf341",
    "bi-eyedropper": "\uf342",
    "bi-eyeglasses": "\uf343",
    "bi-facebook": "\uf344",
    "bi-file-arrow-down-fill": "\uf345",
    "bi-file-arrow-down": "\uf346",
    "bi-file-arrow-up-fill": "\uf347",
    "bi-file-arrow-up": "\uf348",
    "bi-file-bar-graph-fill": "\uf349",
    "bi-file-bar-graph": "\uf34a",
    "bi-file-binary-fill": "\uf34b",
    "bi-file-binary": "\uf34c",
    "bi-file-break-fill": "\uf34d",
    "bi-file-break": "\uf34e",
    "bi-file-check-fill": "\uf34f",
    "bi-file-check": "\uf350",
    "bi-file-code-fill": "\uf351",
    "bi-file-code": "\uf352",
    "bi-file-diff-fill": "\uf353",
    "bi-file-diff": "\uf354",
    "bi-file-earmark-arrow-down-fill": "\uf355",
    "bi-file-earmark-arrow-down": "\uf356",
    "bi-file-earmark-arrow-up-fill": "\uf357",
    "bi-file-earmark-arrow-up": "\uf358",
    "bi-file-earmark-bar-graph-fill": "\uf359",
    "bi-file-earmark-bar-graph": "\uf35a",
    "bi-file-earmark-binary-fill": "\uf35b",
    "bi-file-earmark-binary": "\uf35c",
    "bi-file-earmark-break-fill": "\uf35d",
    "bi-file-earmark-break": "\uf35e",
    "bi-file-earmark-check-fill": "\uf35f",
    "bi-file-earmark-check": "\uf360",
    "bi-file-earmark-code-fill": "\uf361",
    "bi-file-earmark-code": "\uf362",
    "bi-file-earmark-diff-fill": "\uf363",
    "bi-file-earmark-diff": "\uf364",
    "bi-file-earmark-easel-fill": "\uf365",
    "bi-file-earmark-easel": "\uf366",
    "bi-file-earmark-excel-fill": "\uf367",
    "bi-file-earmark-excel": "\uf368",
    "bi-file-earmark-fill": "\uf369",
    "bi-file-earmark-font-fill": "\uf36a",
    "bi-file-earmark-font": "\uf36b",
    "bi-file-earmark-image-fill": "\uf36c",
    "bi-file-earmark-image": "\uf36d",
    "bi-file-earmark-lock-fill": "\uf36e",
    "bi-file-earmark-lock": "\uf36f",
    "bi-file-earmark-lock2-fill": "\uf370",
    "bi-file-earmark-lock2": "\uf371",
    "bi-file-earmark-medical-fill": "\uf372",
    "bi-file-earmark-medical": "\uf373",
    "bi-file-earmark-minus-fill": "\uf374",
    "bi-file-earmark-minus": "\uf375",
    "bi-file-earmark-music-fill": "\uf376",
    "bi-file-earmark-music": "\uf377",
    "bi-file-earmark-person-fill": "\uf378",
    "bi-file-earmark-person": "\uf379",
    "bi-file-earmark-play-fill": "\uf37a",
    "bi-file-earmark-play": "\uf37b",
    "bi-file-earmark-plus-fill": "\uf37c",
    "bi-file-earmark-plus": "\uf37d",
    "bi-file-earmark-post-fill": "\uf37e",
    "bi-file-earmark-post": "\uf37f",
    "bi-file-earmark-ppt-fill": "\uf380",
    "bi-file-earmark-ppt": "\uf381",
    "bi-file-earmark-richtext-fill": "\uf382",
    "bi-file-earmark-richtext": "\uf383",
    "bi-file-earmark-ruled-fill": "\uf384",
    "bi-file-earmark-ruled": "\uf385",
    "bi-file-earmark-slides-fill": "\uf386",
    "bi-file-earmark-slides": "\uf387",
    "bi-file-earmark-spreadsheet-fill": "\uf388",
    "bi-file-earmark-spreadsheet": "\uf389",
    "bi-file-earmark-text-fill": "\uf38a",
    "bi-file-earmark-text": "\uf38b",
    "bi-file-earmark-word-fill": "\uf38c",
    "bi-file-earmark-word": "\uf38d",
    "bi-file-earmark-x-fill": "\uf38e",
    "bi-file-earmark-x": "\uf38f",
    "bi-file-earmark-zip-fill": "\uf390",
    "bi-file-earmark-zip": "\uf391",
    "bi-file-earmark": "\uf392",
    "bi-file-easel-fill": "\uf393",
    "bi-file-easel": "\uf394",
    "bi-file-excel-fill": "\uf395",
    "bi-file-excel": "\uf396",
    "bi-file-fill": "\uf397",
    "bi-file-font-fill": "\uf398",
    "bi-file-font": "\uf399",
    "bi-file-image-fill": "\uf39a",
    "bi-file-image": "\uf39b",
    "bi-file-lock-fill": "\uf39c",
    "bi-file-lock": "\uf39d",
    "bi-file-lock2-fill": "\uf39e",
    "bi-file-lock2": "\uf39f",
    "bi-file-medical-fill": "\uf3a0",
    "bi-file-medical": "\uf3a1",
    "bi-file-minus-fill": "\uf3a2",
    "bi-file-minus": "\uf3a3",
    "bi-file-music-fill": "\uf3a4",
    "bi-file-music": "\uf3a5",
    "bi-file-person-fill": "\uf3a6",
    "bi-file-person": "\uf3a7",
    "bi-file-play-fill": "\uf3a8",
    "bi-file-play": "\uf3a9",
    "bi-file-plus-fill": "\uf3aa",
    "bi-file-plus": "\uf3ab",
    "bi-file-post-fill": "\uf3ac",
    "bi-file-post": "\uf3ad",
    "bi-file-ppt-fill": "\uf3ae",
    "bi-file-ppt": "\uf3af",
    "bi-file-richtext-fill": "\uf3b0",
    "bi-file-richtext": "\uf3b1",
    "bi-file-ruled-fill": "\uf3b2",
    "bi-file-ruled": "\uf3b3",
    "bi-file-slides-fill": "\uf3b4",
    "bi-file-slides": "\uf3b5",
    "bi-file-spreadsheet-fill": "\uf3b6",
    "bi-file-spreadsheet": "\uf3b7",
    "bi-file-text-fill": "\uf3b8",
    "bi-file-text": "\uf3b9",
    "bi-file-word-fill": "\uf3ba",
    "bi-file-word": "\uf3bb",
    "bi-file-x-fill": "\uf3bc",
    "bi-file-x": "\uf3bd",
    "bi-file-zip-fill": "\uf3be",
    "bi-file-zip": "\uf3bf",
    "bi-file": "\uf3c0",
    "bi-files-alt": "\uf3c1",
    "bi-files": "\uf3c2",
    "bi-film": "\uf3c3",
    "bi-filter-circle-fill": "\uf3c4",
    "bi-filter-circle": "\uf3c5",
    "bi-filter-left": "\uf3c6",
    "bi-filter-right": "\uf3c7",
    "bi-filter-square-fill": "\uf3c8",
    "bi-filter-square": "\uf3c9",
    "bi-filter": "\uf3ca",
    "bi-flag-fill": "\uf3cb",
    "bi-flag": "\uf3cc",
    "bi-flower1": "\uf3cd",
    "bi-flower2": "\uf3ce",
    "bi-flower3": "\uf3cf",
    "bi-folder-check": "\uf3d0",
    "bi-folder-fill": "\uf3d1",
    "bi-folder-minus": "\uf3d2",
    "bi-folder-plus": "\uf3d3",
    "bi-folder-symlink-fill": "\uf3d4",
    "bi-folder-symlink": "\uf3d5",
    "bi-folder-x": "\uf3d6",
    "bi-folder": "\uf3d7",
    "bi-folder2-open": "\uf3d8",
    "bi-folder2": "\uf3d9",
    "bi-fonts": "\uf3da",
    "bi-forward-fill": "\uf3db",
    "bi-forward": "\uf3dc",
    "bi-front": "\uf3dd",
    "bi-fullscreen-exit": "\uf3de",
    "bi-fullscreen": "\uf3df",
    "bi-funnel-fill": "\uf3e0",
    "bi-funnel": "\uf3e1",
    "bi-gear-fill": "\uf3e2",
    "bi-gear-wide-connected": "\uf3e3",
    "bi-gear-wide": "\uf3e4",
    "bi-gear": "\uf3e5",
    "bi-gem": "\uf3e6",
    "bi-geo-alt-fill": "\uf3e7",
    "bi-geo-alt": "\uf3e8",
    "bi-geo-fill": "\uf3e9",
    "bi-geo": "\uf3ea",
    "bi-gift-fill": "\uf3eb",
    "bi-gift": "\uf3ec",
    "bi-github": "\uf3ed",
    "bi-globe": "\uf3ee",
    "bi-globe2": "\uf3ef",
    "bi-google": "\uf3f0",
    "bi-graph-down": "\uf3f1",
    "bi-graph-up": "\uf3f2",
    "bi-grid-1x2-fill": "\uf3f3",
    "bi-grid-1x2": "\uf3f4",
    "bi-grid-3x2-gap-fill": "\uf3f5",
    "bi-grid-3x2-gap": "\uf3f6",
    "bi-grid-3x2": "\uf3f7",
    "bi-grid-3x3-gap-fill": "\uf3f8",
    "bi-grid-3x3-gap": "\uf3f9",
    "bi-grid-3x3": "\uf3fa",
    "bi-grid-fill": "\uf3fb",
    "bi-grid": "\uf3fc",
    "bi-grip-horizontal": "\uf3fd",
    "bi-grip-vertical": "\uf3fe",
    "bi-hammer": "\uf3ff",
    "bi-hand-index-fill": "\uf400",
    "bi-hand-index-thumb-fill": "\uf401",
    "bi-hand-index-thumb": "\uf402",
    "bi-hand-index": "\uf403",
    "bi-hand-thumbs-down-fill": "\uf404",
    "bi-hand-thumbs-down": "\uf405",
    "bi-hand-thumbs-up-fill": "\uf406",
    "bi-hand-thumbs-up": "\uf407",
    "bi-handbag-fill": "\uf408",
    "bi-handbag": "\uf409",
    "bi-hash": "\uf40a",
    "bi-hdd-fill": "\uf40b",
    "bi-hdd-network-fill": "\uf40c",
    "bi-hdd-network": "\uf40d",
    "bi-hdd-rack-fill": "\uf40e",
    "bi-hdd-rack": "\uf40f",
    "bi-hdd-stack-fill": "\uf410",
    "bi-hdd-stack": "\uf411",
    "bi-hdd": "\uf412",
    "bi-headphones": "\uf413",
    "bi-headset": "\uf414",
    "bi-heart-fill": "\uf415",
    "bi-heart-half": "\uf416",
    "bi-heart": "\uf417",
    "bi-heptagon-fill": "\uf418",
    "bi-heptagon-half": "\uf419",
    "bi-heptagon": "\uf41a",
    "bi-hexagon-fill": "\uf41b",
    "bi-hexagon-half": "\uf41c",
    "bi-hexagon": "\uf41d",
    "bi-hourglass-bottom": "\uf41e",
    "bi-hourglass-split": "\uf41f",
    "bi-hourglass-top": "\uf420",
    "bi-hourglass": "\uf421",
    "bi-house-door-fill": "\uf422",
    "bi-house-door": "\uf423",
    "bi-house-fill": "\uf424",
    "bi-house": "\uf425",
    "bi-hr": "\uf426",
    "bi-hurricane": "\uf427",
    "bi-image-alt": "\uf428",
    "bi-image-fill": "\uf429",
    "bi-image": "\uf42a",
    "bi-images": "\uf42b",
    "bi-inbox-fill": "\uf42c",
    "bi-inbox": "\uf42d",
    "bi-inboxes-fill": "\uf42e",
    "bi-inboxes": "\uf42f",
    "bi-info-circle-fill": "\uf430",
    "bi-info-circle": "\uf431",
    "bi-info-square-fill": "\uf432",
    "bi-info-square": "\uf433",
    "bi-info": "\uf434",
    "bi-input-cursor-text": "\uf435",
    "bi-input-cursor": "\uf436",
    "bi-instagram": "\uf437",
    "bi-intersect": "\uf438",
    "bi-journal-album": "\uf439",
    "bi-journal-arrow-down": "\uf43a",
    "bi-journal-arrow-up": "\uf43b",
    "bi-journal-bookmark-fill": "\uf43c",
    "bi-journal-bookmark": "\uf43d",
    "bi-journal-check": "\uf43e",
    "bi-journal-code": "\uf43f",
    "bi-journal-medical": "\uf440",
    "bi-journal-minus": "\uf441",
    "bi-journal-plus": "\uf442",
    "bi-journal-richtext": "\uf443",
    "bi-journal-text": "\uf444",
    "bi-journal-x": "\uf445",
    "bi-journal": "\uf446",
    "bi-journals": "\uf447",
    "bi-joystick": "\uf448",
    "bi-justify-left": "\uf449",
    "bi-justify-right": "\uf44a",
    "bi-justify": "\uf44b",
    "bi-kanban-fill": "\uf44c",
    "bi-kanban": "\uf44d",
    "bi-key-fill": "\uf44e",
    "bi-key": "\uf44f",
    "bi-keyboard-fill": "\uf450",
    "bi-keyboard": "\uf451",
    "bi-ladder": "\uf452",
    "bi-lamp-fill": "\uf453",
    "bi-lamp": "\uf454",
    "bi-laptop-fill": "\uf455",
    "bi-laptop": "\uf456",
    "bi-layer-backward": "\uf457",
    "bi-layer-forward": "\uf458",
    "bi-layers-fill": "\uf459",
    "bi-layers-half": "\uf45a",
    "bi-layers": "\uf45b",
    "bi-layout-sidebar-inset-reverse": "\uf45c",
    "bi-layout-sidebar-inset": "\uf45d",
    "bi-layout-sidebar-reverse": "\uf45e",
    "bi-layout-sidebar": "\uf45f",
    "bi-layout-split": "\uf460",
    "bi-layout-text-sidebar-reverse": "\uf461",
    "bi-layout-text-sidebar": "\uf462",
    "bi-layout-text-window-reverse": "\uf463",
    "bi-layout-text-window": "\uf464",
    "bi-layout-three-columns": "\uf465",
    "bi-layout-wtf": "\uf466",
    "bi-life-preserver": "\uf467",
    "bi-lightbulb-fill": "\uf468",
    "bi-lightbulb-off-fill": "\uf469",
    "bi-lightbulb-off": "\uf46a",
    "bi-lightbulb": "\uf46b",
    "bi-lightning-charge-fill": "\uf46c",
    "bi-lightning-charge": "\uf46d",
    "bi-lightning-fill": "\uf46e",
    "bi-lightning": "\uf46f",
    "bi-link-45deg": "\uf470",
    "bi-link": "\uf471",
    "bi-linkedin": "\uf472",
    "bi-list-check": "\uf473",
    "bi-list-nested": "\uf474",
    "bi-list-ol": "\uf475",
    "bi-list-stars": "\uf476",
    "bi-list-task": "\uf477",
    "bi-list-ul": "\uf478",
    "bi-list": "\uf479",
    "bi-lock-fill": "\uf47a",
    "bi-lock": "\uf47b",
    "bi-mailbox": "\uf47c",
    "bi-mailbox2": "\uf47d",
    "bi-map-fill": "\uf47e",
    "bi-map": "\uf47f",
    "bi-markdown-fill": "\uf480",
    "bi-markdown": "\uf481",
    "bi-mask": "\uf482",
    "bi-megaphone-fill": "\uf483",
    "bi-megaphone": "\uf484",
    "bi-menu-app-fill": "\uf485",
    "bi-menu-app": "\uf486",
    "bi-menu-button-fill": "\uf487",
    "bi-menu-button-wide-fill": "\uf488",
    "bi-menu-button-wide": "\uf489",
    "bi-menu-button": "\uf48a",
    "bi-menu-down": "\uf48b",
    "bi-menu-up": "\uf48c",
    "bi-mic-fill": "\uf48d",
    "bi-mic-mute-fill": "\uf48e",
    "bi-mic-mute": "\uf48f",
    "bi-mic": "\uf490",
    "bi-minecart-loaded": "\uf491",
    "bi-minecart": "\uf492",
    "bi-moisture": "\uf493",
    "bi-moon-fill": "\uf494",
    "bi-moon-stars-fill": "\uf495",
    "bi-moon-stars": "\uf496",
    "bi-moon": "\uf497",
    "bi-mouse-fill": "\uf498",
    "bi-mouse": "\uf499",
    "bi-mouse2-fill": "\uf49a",
    "bi-mouse2": "\uf49b",
    "bi-mouse3-fill": "\uf49c",
    "bi-mouse3": "\uf49d",
    "bi-music-note-beamed": "\uf49e",
    "bi-music-note-list": "\uf49f",
    "bi-music-note": "\uf4a0",
    "bi-music-player-fill": "\uf4a1",
    "bi-music-player": "\uf4a2",
    "bi-newspaper": "\uf4a3",
    "bi-node-minus-fill": "\uf4a4",
    "bi-node-minus": "\uf4a5",
    "bi-node-plus-fill": "\uf4a6",
    "bi-node-plus": "\uf4a7",
    "bi-nut-fill": "\uf4a8",
    "bi-nut": "\uf4a9",
    "bi-octagon-fill": "\uf4aa",
    "bi-octagon-half": "\uf4ab",
    "bi-octagon": "\uf4ac",
    "bi-option": "\uf4ad",
    "bi-outlet": "\uf4ae",
    "bi-paint-bucket": "\uf4af",
    "bi-palette-fill": "\uf4b0",
    "bi-palette": "\uf4b1",
    "bi-palette2": "\uf4b2",
    "bi-paperclip": "\uf4b3",
    "bi-paragraph": "\uf4b4",
    "bi-patch-check-fill": "\uf4b5",
    "bi-patch-check": "\uf4b6",
    "bi-patch-exclamation-fill": "\uf4b7",
    "bi-patch-exclamation": "\uf4b8",
    "bi-patch-minus-fill": "\uf4b9",
    "bi-patch-minus": "\uf4ba",
    "bi-patch-plus-fill": "\uf4bb",
    "bi-patch-plus": "\uf4bc",
    "bi-patch-question-fill": "\uf4bd",
    "bi-patch-question": "\uf4be",
    "bi-pause-btn-fill": "\uf4bf",
    "bi-pause-btn": "\uf4c0",
    "bi-pause-circle-fill": "\uf4c1",
    "bi-pause-circle": "\uf4c2",
    "bi-pause-fill": "\uf4c3",
    "bi-pause": "\uf4c4",
    "bi-peace-fill": "\uf4c5",
    "bi-peace": "\uf4c6",
    "bi-pen-fill": "\uf4c7",
    "bi-pen": "\uf4c8",
    "bi-pencil-fill": "\uf4c9",
    "bi-pencil-square": "\uf4ca",
    "bi-pencil": "\uf4cb",
    "bi-pentagon-fill": "\uf4cc",
    "bi-pentagon-half": "\uf4cd",
    "bi-pentagon": "\uf4ce",
    "bi-people-fill": "\uf4cf",
    "bi-people": "\uf4d0",
    "bi-percent": "\uf4d1",
    "bi-person-badge-fill": "\uf4d2",
    "bi-person-badge": "\uf4d3",
    "bi-person-bounding-box": "\uf4d4",
    "bi-person-check-fill": "\uf4d5",
    "bi-person-check": "\uf4d6",
    "bi-person-circle": "\uf4d7",
    "bi-person-dash-fill": "\uf4d8",
    "bi-person-dash": "\uf4d9",
    "bi-person-fill": "\uf4da",
    "bi-person-lines-fill": "\uf4db",
    "bi-person-plus-fill": "\uf4dc",
    "bi-person-plus": "\uf4dd",
    "bi-person-square": "\uf4de",
    "bi-person-x-fill": "\uf4df",
    "bi-person-x": "\uf4e0",
    "bi-person": "\uf4e1",
    "bi-phone-fill": "\uf4e2",
    "bi-phone-landscape-fill": "\uf4e3",
    "bi-phone-landscape": "\uf4e4",
    "bi-phone-vibrate-fill": "\uf4e5",
    "bi-phone-vibrate": "\uf4e6",
    "bi-phone": "\uf4e7",
    "bi-pie-chart-fill": "\uf4e8",
    "bi-pie-chart": "\uf4e9",
    "bi-pin-angle-fill": "\uf4ea",
    "bi-pin-angle": "\uf4eb",
    "bi-pin-fill": "\uf4ec",
    "bi-pin": "\uf4ed",
    "bi-pip-fill": "\uf4ee",
    "bi-pip": "\uf4ef",
    "bi-play-btn-fill": "\uf4f0",
    "bi-play-btn": "\uf4f1",
    "bi-play-circle-fill": "\uf4f2",
    "bi-play-circle": "\uf4f3",
    "bi-play-fill": "\uf4f4",
    "bi-play": "\uf4f5",
    "bi-plug-fill": "\uf4f6",
    "bi-plug": "\uf4f7",
    "bi-plus-circle-dotted": "\uf4f8",
    "bi-plus-circle-fill": "\uf4f9",
    "bi-plus-circle": "\uf4fa",
    "bi-plus-square-dotted": "\uf4fb",
    "bi-plus-square-fill": "\uf4fc",
    "bi-plus-square": "\uf4fd",
    "bi-plus": "\uf4fe",
    "bi-power": "\uf4ff",
    "bi-printer-fill": "\uf500",
    "bi-printer": "\uf501",
    "bi-puzzle-fill": "\uf502",
    "bi-puzzle": "\uf503",
    "bi-question-circle-fill": "\uf504",
    "bi-question-circle": "\uf505",
    "bi-question-diamond-fill": "\uf506",
    "bi-question-diamond": "\uf507",
    "bi-question-octagon-fill": "\uf508",
    "bi-question-octagon": "\uf509",
    "bi-question-square-fill": "\uf50a",
    "bi-question-square": "\uf50b",
    "bi-question": "\uf50c",
    "bi-rainbow": "\uf50d",
    "bi-receipt-cutoff": "\uf50e",
    "bi-receipt": "\uf50f",
    "bi-reception-0": "\uf510",
    "bi-reception-1": "\uf511",
    "bi-reception-2": "\uf512",
    "bi-reception-3": "\uf513",
    "bi-reception-4": "\uf514",
    "bi-record-btn-fill": "\uf515",
    "bi-record-btn": "\uf516",
    "bi-record-circle-fill": "\uf517",
    "bi-record-circle": "\uf518",
    "bi-record-fill": "\uf519",
    "bi-record": "\uf51a",
    "bi-record2-fill": "\uf51b",
    "bi-record2": "\uf51c",
    "bi-reply-all-fill": "\uf51d",
    "bi-reply-all": "\uf51e",
    "bi-reply-fill": "\uf51f",
    "bi-reply": "\uf520",
    "bi-rss-fill": "\uf521",
    "bi-rss": "\uf522",
    "bi-rulers": "\uf523",
    "bi-save-fill": "\uf524",
    "bi-save": "\uf525",
    "bi-save2-fill": "\uf526",
    "bi-save2": "\uf527",
    "bi-scissors": "\uf528",
    "bi-screwdriver": "\uf529",
    "bi-search": "\uf52a",
    "bi-segmented-nav": "\uf52b",
    "bi-server": "\uf52c",
    "bi-share-fill": "\uf52d",
    "bi-share": "\uf52e",
    "bi-shield-check": "\uf52f",
    "bi-shield-exclamation": "\uf530",
    "bi-shield-fill-check": "\uf531",
    "bi-shield-fill-exclamation": "\uf532",
    "bi-shield-fill-minus": "\uf533",
    "bi-shield-fill-plus": "\uf534",
    "bi-shield-fill-x": "\uf535",
    "bi-shield-fill": "\uf536",
    "bi-shield-lock-fill": "\uf537",
    "bi-shield-lock": "\uf538",
    "bi-shield-minus": "\uf539",
    "bi-shield-plus": "\uf53a",
    "bi-shield-shaded": "\uf53b",
    "bi-shield-slash-fill": "\uf53c",
    "bi-shield-slash": "\uf53d",
    "bi-shield-x": "\uf53e",
    "bi-shield": "\uf53f",
    "bi-shift-fill": "\uf540",
    "bi-shift": "\uf541",
    "bi-shop-window": "\uf542",
    "bi-shop": "\uf543",
    "bi-shuffle": "\uf544",
    "bi-signpost-2-fill": "\uf545",
    "bi-signpost-2": "\uf546",
    "bi-signpost-fill": "\uf547",
    "bi-signpost-split-fill": "\uf548",
    "bi-signpost-split": "\uf549",
    "bi-signpost": "\uf54a",
    "bi-sim-fill": "\uf54b",
    "bi-sim": "\uf54c",
    "bi-skip-backward-btn-fill": "\uf54d",
    "bi-skip-backward-btn": "\uf54e",
    "bi-skip-backward-circle-fill": "\uf54f",
    "bi-skip-backward-circle": "\uf550",
    "bi-skip-backward-fill": "\uf551",
    "bi-skip-backward": "\uf552",
    "bi-skip-end-btn-fill": "\uf553",
    "bi-skip-end-btn": "\uf554",
    "bi-skip-end-circle-fill": "\uf555",
    "bi-skip-end-circle": "\uf556",
    "bi-skip-end-fill": "\uf557",
    "bi-skip-end": "\uf558",
    "bi-skip-forward-btn-fill": "\uf559",
    "bi-skip-forward-btn": "\uf55a",
    "bi-skip-forward-circle-fill": "\uf55b",
    "bi-skip-forward-circle": "\uf55c",
    "bi-skip-forward-fill": "\uf55d",
    "bi-skip-forward": "\uf55e",
    "bi-skip-start-btn-fill": "\uf55f",
    "bi-skip-start-btn": "\uf560",
    "bi-skip-start-circle-fill": "\uf561",
    "bi-skip-start-circle": "\uf562",
    "bi-skip-start-fill": "\uf563",
    "bi-skip-start": "\uf564",
    "bi-slack": "\uf565",
    "bi-slash-circle-fill": "\uf566",
    "bi-slash-circle": "\uf567",
    "bi-slash-square-fill": "\uf568",
    "bi-slash-square": "\uf569",
    "bi-slash": "\uf56a",
    "bi-sliders": "\uf56b",
    "bi-smartwatch": "\uf56c",
    "bi-snow": "\uf56d",
    "bi-snow2": "\uf56e",
    "bi-snow3": "\uf56f",
    "bi-sort-alpha-down-alt": "\uf570",
    "bi-sort-alpha-down": "\uf571",
    "bi-sort-alpha-up-alt": "\uf572",
    "bi-sort-alpha-up": "\uf573",
    "bi-sort-down-alt": "\uf574",
    "bi-sort-down": "\uf575",
    "bi-sort-numeric-down-alt": "\uf576",
    "bi-sort-numeric-down": "\uf577",
    "bi-sort-numeric-up-alt": "\uf578",
    "bi-sort-numeric-up": "\uf579",
    "bi-sort-up-alt": "\uf57a",
    "bi-sort-up": "\uf57b",
    "bi-soundwave": "\uf57c",
    "bi-speaker-fill": "\uf57d",
    "bi-speaker": "\uf57e",
    "bi-speedometer": "\uf57f",
    "bi-speedometer2": "\uf580",
    "bi-spellcheck": "\uf581",
    "bi-square-fill": "\uf582",
    "bi-square-half": "\uf583",
    "bi-square": "\uf584",
    "bi-stack": "\uf585",
    "bi-star-fill": "\uf586",
    "bi-star-half": "\uf587",
    "bi-star": "\uf588",
    "bi-stars": "\uf589",
    "bi-stickies-fill": "\uf58a",
    "bi-stickies": "\uf58b",
    "bi-sticky-fill": "\uf58c",
    "bi-sticky": "\uf58d",
    "bi-stop-btn-fill": "\uf58e",
    "bi-stop-btn": "\uf58f",
    "bi-stop-circle-fill": "\uf590",
    "bi-stop-circle": "\uf591",
    "bi-stop-fill": "\uf592",
    "bi-stop": "\uf593",
    "bi-stoplights-fill": "\uf594",
    "bi-stoplights": "\uf595",
    "bi-stopwatch-fill": "\uf596",
    "bi-stopwatch": "\uf597",
    "bi-subtract": "\uf598",
    "bi-suit-club-fill": "\uf599",
    "bi-suit-club": "\uf59a",
    "bi-suit-diamond-fill": "\uf59b",
    "bi-suit-diamond": "\uf59c",
    "bi-suit-heart-fill": "\uf59d",
    "bi-suit-heart": "\uf59e",
    "bi-suit-spade-fill": "\uf59f",
    "bi-suit-spade": "\uf5a0",
    "bi-sun-fill": "\uf5a1",
    "bi-sun": "\uf5a2",
    "bi-sunglasses": "\uf5a3",
    "bi-sunrise-fill": "\uf5a4",
    "bi-sunrise": "\uf5a5",
    "bi-sunset-fill": "\uf5a6",
    "bi-sunset": "\uf5a7",
    "bi-symmetry-horizontal": "\uf5a8",
    "bi-symmetry-vertical": "\uf5a9",
    "bi-table": "\uf5aa",
    "bi-tablet-fill": "\uf5ab",
    "bi-tablet-landscape-fill": "\uf5ac",
    "bi-tablet-landscape": "\uf5ad",
    "bi-tablet": "\uf5ae",
    "bi-tag-fill": "\uf5af",
    "bi-tag": "\uf5b0",
    "bi-tags-fill": "\uf5b1",
    "bi-tags": "\uf5b2",
    "bi-telegram": "\uf5b3",
    "bi-telephone-fill": "\uf5b4",
    "bi-telephone-forward-fill": "\uf5b5",
    "bi-telephone-forward": "\uf5b6",
    "bi-telephone-inbound-fill": "\uf5b7",
    "bi-telephone-inbound": "\uf5b8",
    "bi-telephone-minus-fill": "\uf5b9",
    "bi-telephone-minus": "\uf5ba",
    "bi-telephone-outbound-fill": "\uf5bb",
    "bi-telephone-outbound": "\uf5bc",
    "bi-telephone-plus-fill": "\uf5bd",
    "bi-telephone-plus": "\uf5be",
    "bi-telephone-x-fill": "\uf5bf",
    "bi-telephone-x": "\uf5c0",
    "bi-telephone": "\uf5c1",
    "bi-terminal-fill": "\uf5c2",
    "bi-terminal": "\uf5c3",
    "bi-text-center": "\uf5c4",
    "bi-text-indent-left": "\uf5c5",
    "bi-text-indent-right": "\uf5c6",
    "bi-text-left": "\uf5c7",
    "bi-text-paragraph": "\uf5c8",
    "bi-text-right": "\uf5c9",
    "bi-textarea-resize": "\uf5ca",
    "bi-textarea-t": "\uf5cb",
    "bi-textarea": "\uf5cc",
    "bi-thermometer-half": "\uf5cd",
    "bi-thermometer-high": "\uf5ce",
    "bi-thermometer-low": "\uf5cf",
    "bi-thermometer-snow": "\uf5d0",
    "bi-thermometer-sun": "\uf5d1",
    "bi-thermometer": "\uf5d2",
    "bi-three-dots-vertical": "\uf5d3",
    "bi-three-dots": "\uf5d4",
    "bi-toggle-off": "\uf5d5",
    "bi-toggle-on": "\uf5d6",
    "bi-toggle2-off": "\uf5d7",
    "bi-toggle2-on": "\uf5d8",
    "bi-toggles": "\uf5d9",
    "bi-toggles2": "\uf5da",
    "bi-tools": "\uf5db",
    "bi-tornado": "\uf5dc",
    "bi-trash-fill": "\uf5dd",
    "bi-trash": "\uf5de",
    "bi-trash2-fill": "\uf5df",
    "bi-trash2": "\uf5e0",
    "bi-tree-fill": "\uf5e1",
    "bi-tree": "\uf5e2",
    "bi-triangle-fill": "\uf5e3",
    "bi-triangle-half": "\uf5e4",
    "bi-triangle": "\uf5e5",
    "bi-trophy-fill": "\uf5e6",
    "bi-trophy": "\uf5e7",
    "bi-tropical-storm": "\uf5e8",
    "bi-truck-flatbed": "\uf5e9",
    "bi-truck": "\uf5ea",
    "bi-tsunami": "\uf5eb",
    "bi-tv-fill": "\uf5ec",
    "bi-tv": "\uf5ed",
    "bi-twitch": "\uf5ee",
    "bi-twitter": "\uf5ef",
    "bi-type-bold": "\uf5f0",
    "bi-type-h1": "\uf5f1",
    "bi-type-h2": "\uf5f2",
    "bi-type-h3": "\uf5f3",
    "bi-type-italic": "\uf5f4",
    "bi-type-strikethrough": "\uf5f5",
    "bi-type-underline": "\uf5f6",
    "bi-type": "\uf5f7",
    "bi-ui-checks-grid": "\uf5f8",
    "bi-ui-checks": "\uf5f9",
    "bi-ui-radios-grid": "\uf5fa",
    "bi-ui-radios": "\uf5fb",
    "bi-umbrella-fill": "\uf5fc",
    "bi-umbrella": "\uf5fd",
    "bi-union": "\uf5fe",
    "bi-unlock-fill": "\uf5ff",
    "bi-unlock": "\uf600",
    "bi-upc-scan": "\uf601",
    "bi-upc": "\uf602",
    "bi-upload": "\uf603",
    "bi-vector-pen": "\uf604",
    "bi-view-list": "\uf605",
    "bi-view-stacked": "\uf606",
    "bi-vinyl-fill": "\uf607",
    "bi-vinyl": "\uf608",
    "bi-voicemail": "\uf609",
    "bi-volume-down-fill": "\uf60a",
    "bi-volume-down": "\uf60b",
    "bi-volume-mute-fill": "\uf60c",
    "bi-volume-mute": "\uf60d",
    "bi-volume-off-fill": "\uf60e",
    "bi-volume-off": "\uf60f",
    "bi-volume-up-fill": "\uf610",
    "bi-volume-up": "\uf611",
    "bi-vr": "\uf612",
    "bi-wallet-fill": "\uf613",
    "bi-wallet": "\uf614",
    "bi-wallet2": "\uf615",
    "bi-watch": "\uf616",
    "bi-water": "\uf617",
    "bi-whatsapp": "\uf618",
    "bi-wifi-1": "\uf619",
    "bi-wifi-2": "\uf61a",
    "bi-wifi-off": "\uf61b",
    "bi-wifi": "\uf61c",
    "bi-wind": "\uf61d",
    "bi-window-dock": "\uf61e",
    "bi-window-sidebar": "\uf61f",
    "bi-window": "\uf620",
    "bi-wrench": "\uf621",
    "bi-x-circle-fill": "\uf622",
    "bi-x-circle": "\uf623",
    "bi-x-diamond-fill": "\uf624",
    "bi-x-diamond": "\uf625",
    "bi-x-octagon-fill": "\uf626",
    "bi-x-octagon": "\uf627",
    "bi-x-square-fill": "\uf628",
    "bi-x-square": "\uf629",
    "bi-x": "\uf62a",
    "bi-youtube": "\uf62b",
    "bi-zoom-in": "\uf62c",
    "bi-zoom-out": "\uf62d",
    "bi-bank": "\uf62e",
    "bi-bank2": "\uf62f",
    "bi-bell-slash-fill": "\uf630",
    "bi-bell-slash": "\uf631",
    "bi-cash-coin": "\uf632",
    "bi-check-lg": "\uf633",
    "bi-coin": "\uf634",
    "bi-currency-bitcoin": "\uf635",
    "bi-currency-dollar": "\uf636",
    "bi-currency-euro": "\uf637",
    "bi-currency-exchange": "\uf638",
    "bi-currency-pound": "\uf639",
    "bi-currency-yen": "\uf63a",
    "bi-dash-lg": "\uf63b",
    "bi-exclamation-lg": "\uf63c",
    "bi-file-earmark-pdf-fill": "\uf63d",
    "bi-file-earmark-pdf": "\uf63e",
    "bi-file-pdf-fill": "\uf63f",
    "bi-file-pdf": "\uf640",
    "bi-gender-ambiguous": "\uf641",
    "bi-gender-female": "\uf642",
    "bi-gender-male": "\uf643",
    "bi-gender-trans": "\uf644",
    "bi-headset-vr": "\uf645",
    "bi-info-lg": "\uf646",
    "bi-mastodon": "\uf647",
    "bi-messenger": "\uf648",
    "bi-piggy-bank-fill": "\uf649",
    "bi-piggy-bank": "\uf64a",
    "bi-pin-map-fill": "\uf64b",
    "bi-pin-map": "\uf64c",
    "bi-plus-lg": "\uf64d",
    "bi-question-lg": "\uf64e",
    "bi-recycle": "\uf64f",
    "bi-reddit": "\uf650",
    "bi-safe-fill": "\uf651",
    "bi-safe2-fill": "\uf652",
    "bi-safe2": "\uf653",
    "bi-sd-card-fill": "\uf654",
    "bi-sd-card": "\uf655",
    "bi-skype": "\uf656",
    "bi-slash-lg": "\uf657",
    "bi-translate": "\uf658",
    "bi-x-lg": "\uf659",
    "bi-safe": "\uf65a",
    "bi-apple": "\uf65b",
    "bi-microsoft": "\uf65d",
    "bi-windows": "\uf65e",
    "bi-behance": "\uf65c",
    "bi-dribbble": "\uf65f",
    "bi-line": "\uf660",
    "bi-medium": "\uf661",
    "bi-paypal": "\uf662",
    "bi-pinterest": "\uf663",
    "bi-signal": "\uf664",
    "bi-snapchat": "\uf665",
    "bi-spotify": "\uf666",
    "bi-stack-overflow": "\uf667",
    "bi-strava": "\uf668",
    "bi-wordpress": "\uf669",
    "bi-vimeo": "\uf66a",
    "bi-activity": "\uf66b",
    "bi-easel2-fill": "\uf66c",
    "bi-easel2": "\uf66d",
    "bi-easel3-fill": "\uf66e",
    "bi-easel3": "\uf66f",
    "bi-fan": "\uf670",
    "bi-fingerprint": "\uf671",
    "bi-graph-down-arrow": "\uf672",
    "bi-graph-up-arrow": "\uf673",
    "bi-hypnotize": "\uf674",
    "bi-magic": "\uf675",
    "bi-person-rolodex": "\uf676",
    "bi-person-video": "\uf677",
    "bi-person-video2": "\uf678",
    "bi-person-video3": "\uf679",
    "bi-person-workspace": "\uf67a",
    "bi-radioactive": "\uf67b",
    "bi-webcam-fill": "\uf67c",
    "bi-webcam": "\uf67d",
    "bi-yin-yang": "\uf67e",
    "bi-bandaid-fill": "\uf680",
    "bi-bandaid": "\uf681",
    "bi-bluetooth": "\uf682",
    "bi-body-text": "\uf683",
    "bi-boombox": "\uf684",
    "bi-boxes": "\uf685",
    "bi-dpad-fill": "\uf686",
    "bi-dpad": "\uf687",
    "bi-ear-fill": "\uf688",
    "bi-ear": "\uf689",
    "bi-envelope-check-1": "\uf68a",
    "bi-envelope-check-fill": "\uf68b",
    "bi-envelope-check": "\uf68c",
    "bi-envelope-dash-1": "\uf68d",
    "bi-envelope-dash-fill": "\uf68e",
    "bi-envelope-dash": "\uf68f",
    "bi-envelope-exclamation-1": "\uf690",
    "bi-envelope-exclamation-fill": "\uf691",
    "bi-envelope-exclamation": "\uf692",
    "bi-envelope-plus-fill": "\uf693",
    "bi-envelope-plus": "\uf694",
    "bi-envelope-slash-1": "\uf695",
    "bi-envelope-slash-fill": "\uf696",
    "bi-envelope-slash": "\uf697",
    "bi-envelope-x-1": "\uf698",
    "bi-envelope-x-fill": "\uf699",
    "bi-envelope-x": "\uf69a",
    "bi-explicit-fill": "\uf69b",
    "bi-explicit": "\uf69c",
    "bi-git": "\uf69d",
    "bi-infinity": "\uf69e",
    "bi-list-columns-reverse": "\uf69f",
    "bi-list-columns": "\uf6a0",
    "bi-meta": "\uf6a1",
    "bi-mortorboard-fill": "\uf6a2",
    "bi-mortorboard": "\uf6a3",
    "bi-nintendo-switch": "\uf6a4",
    "bi-pc-display-horizontal": "\uf6a5",
    "bi-pc-display": "\uf6a6",
    "bi-pc-horizontal": "\uf6a7",
    "bi-pc": "\uf6a8",
    "bi-playstation": "\uf6a9",
    "bi-plus-slash-minus": "\uf6aa",
    "bi-projector-fill": "\uf6ab",
    "bi-projector": "\uf6ac",
    "bi-qr-code-scan": "\uf6ad",
    "bi-qr-code": "\uf6ae",
    "bi-quora": "\uf6af",
    "bi-quote": "\uf6b0",
    "bi-robot": "\uf6b1",
    "bi-send-check-fill": "\uf6b2",
    "bi-send-check": "\uf6b3",
    "bi-send-dash-fill": "\uf6b4",
    "bi-send-dash": "\uf6b5",
    "bi-send-exclamation-1": "\uf6b6",
    "bi-send-exclamation-fill": "\uf6b7",
    "bi-send-exclamation": "\uf6b8",
    "bi-send-fill": "\uf6b9",
    "bi-send-plus-fill": "\uf6ba",
    "bi-send-plus": "\uf6bb",
    "bi-send-slash-fill": "\uf6bc",
    "bi-send-slash": "\uf6bd",
    "bi-send-x-fill": "\uf6be",
    "bi-send-x": "\uf6bf",
    "bi-send": "\uf6c0",
    "bi-steam": "\uf6c1",
    "bi-terminal-dash-1": "\uf6c2",
    "bi-terminal-dash": "\uf6c3",
    "bi-terminal-plus": "\uf6c4",
    "bi-terminal-split": "\uf6c5",
    "bi-ticket-detailed-fill": "\uf6c6",
    "bi-ticket-detailed": "\uf6c7",
    "bi-ticket-fill": "\uf6c8",
    "bi-ticket-perforated-fill": "\uf6c9",
    "bi-ticket-perforated": "\uf6ca",
    "bi-ticket": "\uf6cb",
    "bi-tiktok": "\uf6cc",
    "bi-window-dash": "\uf6cd",
    "bi-window-desktop": "\uf6ce",
    "bi-window-fullscreen": "\uf6cf",
    "bi-window-plus": "\uf6d0",
    "bi-window-split": "\uf6d1",
    "bi-window-stack": "\uf6d2",
    "bi-window-x": "\uf6d3",
    "bi-xbox": "\uf6d4",
    "bi-ethernet": "\uf6d5",
    "bi-hdmi-fill": "\uf6d6",
    "bi-hdmi": "\uf6d7",
    "bi-usb-c-fill": "\uf6d8",
    "bi-usb-c": "\uf6d9",
    "bi-usb-fill": "\uf6da",
    "bi-usb-plug-fill": "\uf6db",
    "bi-usb-plug": "\uf6dc",
    "bi-usb-symbol": "\uf6dd",
    "bi-usb": "\uf6de",
    "bi-boombox-fill": "\uf6df",
    "bi-displayport-1": "\uf6e0",
    "bi-displayport": "\uf6e1",
    "bi-gpu-card": "\uf6e2",
    "bi-memory": "\uf6e3",
    "bi-modem-fill": "\uf6e4",
    "bi-modem": "\uf6e5",
    "bi-motherboard-fill": "\uf6e6",
    "bi-motherboard": "\uf6e7",
    "bi-optical-audio-fill": "\uf6e8",
    "bi-optical-audio": "\uf6e9",
    "bi-pci-card": "\uf6ea",
    "bi-router-fill": "\uf6eb",
    "bi-router": "\uf6ec",
    "bi-ssd-fill": "\uf6ed",
    "bi-ssd": "\uf6ee",
    "bi-thunderbolt-fill": "\uf6ef",
    "bi-thunderbolt": "\uf6f0",
    "bi-usb-drive-fill": "\uf6f1",
    "bi-usb-drive": "\uf6f2",
    "bi-usb-micro-fill": "\uf6f3",
    "bi-usb-micro": "\uf6f4",
    "bi-usb-mini-fill": "\uf6f5",
    "bi-usb-mini": "\uf6f6",
    "bi-cloud-haze2": "\uf6f7",
    "bi-device-hdd-fill": "\uf6f8",
    "bi-device-hdd": "\uf6f9",
    "bi-device-ssd-fill": "\uf6fa",
    "bi-device-ssd": "\uf6fb",
    "bi-displayport-fill": "\uf6fc",
    "bi-mortarboard-fill": "\uf6fd",
    "bi-mortarboard": "\uf6fe",
    "bi-terminal-x": "\uf6ff",
    "bi-arrow-through-heart-fill": "\uf700",
    "bi-arrow-through-heart": "\uf701",
    "bi-badge-sd-fill": "\uf702",
    "bi-badge-sd": "\uf703",
    "bi-bag-heart-fill": "\uf704",
    "bi-bag-heart": "\uf705",
    "bi-balloon-fill": "\uf706",
    "bi-balloon-heart-fill": "\uf707",
    "bi-balloon-heart": "\uf708",
    "bi-balloon": "\uf709",
    "bi-box2-fill": "\uf70a",
    "bi-box2-heart-fill": "\uf70b",
    "bi-box2-heart": "\uf70c",
    "bi-box2": "\uf70d",
    "bi-braces-asterisk": "\uf70e",
    "bi-calendar-heart-fill": "\uf70f",
    "bi-calendar-heart": "\uf710",
    "bi-calendar2-heart-fill": "\uf711",
    "bi-calendar2-heart": "\uf712",
    "bi-chat-heart-fill": "\uf713",
    "bi-chat-heart": "\uf714",
    "bi-chat-left-heart-fill": "\uf715",
    "bi-chat-left-heart": "\uf716",
    "bi-chat-right-heart-fill": "\uf717",
    "bi-chat-right-heart": "\uf718",
    "bi-chat-square-heart-fill": "\uf719",
    "bi-chat-square-heart": "\uf71a",
    "bi-clipboard-check-fill": "\uf71b",
    "bi-clipboard-data-fill": "\uf71c",
    "bi-clipboard-fill": "\uf71d",
    "bi-clipboard-heart-fill": "\uf71e",
    "bi-clipboard-heart": "\uf71f",
    "bi-clipboard-minus-fill": "\uf720",
    "bi-clipboard-plus-fill": "\uf721",
    "bi-clipboard-pulse": "\uf722",
    "bi-clipboard-x-fill": "\uf723",
    "bi-clipboard2-check-fill": "\uf724",
    "bi-clipboard2-check": "\uf725",
    "bi-clipboard2-data-fill": "\uf726",
    "bi-clipboard2-data": "\uf727",
    "bi-clipboard2-fill": "\uf728",
    "bi-clipboard2-heart-fill": "\uf729",
    "bi-clipboard2-heart": "\uf72a",
    "bi-clipboard2-minus-fill": "\uf72b",
    "bi-clipboard2-minus": "\uf72c",
    "bi-clipboard2-plus-fill": "\uf72d",
    "bi-clipboard2-plus": "\uf72e",
    "bi-clipboard2-pulse-fill": "\uf72f",
    "bi-clipboard2-pulse": "\uf730",
    "bi-clipboard2-x-fill": "\uf731",
    "bi-clipboard2-x": "\uf732",
    "bi-clipboard2": "\uf733",
    "bi-emoji-kiss-fill": "\uf734",
    "bi-emoji-kiss": "\uf735",
    "bi-envelope-heart-fill": "\uf736",
    "bi-envelope-heart": "\uf737",
    "bi-envelope-open-heart-fill": "\uf738",
    "bi-envelope-open-heart": "\uf739",
    "bi-envelope-paper-fill": "\uf73a",
    "bi-envelope-paper-heart-fill": "\uf73b",
    "bi-envelope-paper-heart": "\uf73c",
    "bi-envelope-paper": "\uf73d",
    "bi-filetype-aac": "\uf73e",
    "bi-filetype-ai": "\uf73f",
    "bi-filetype-bmp": "\uf740",
    "bi-filetype-cs": "\uf741",
    "bi-filetype-css": "\uf742",
    "bi-filetype-csv": "\uf743",
    "bi-filetype-doc": "\uf744",
    "bi-filetype-docx": "\uf745",
    "bi-filetype-exe": "\uf746",
    "bi-filetype-gif": "\uf747",
    "bi-filetype-heic": "\uf748",
    "bi-filetype-html": "\uf749",
    "bi-filetype-java": "\uf74a",
    "bi-filetype-jpg": "\uf74b",
    "bi-filetype-js": "\uf74c",
    "bi-filetype-jsx": "\uf74d",
    "bi-filetype-key": "\uf74e",
    "bi-filetype-m4p": "\uf74f",
    "bi-filetype-md": "\uf750",
    "bi-filetype-mdx": "\uf751",
    "bi-filetype-mov": "\uf752",
    "bi-filetype-mp3": "\uf753",
    "bi-filetype-mp4": "\uf754",
    "bi-filetype-otf": "\uf755",
    "bi-filetype-pdf": "\uf756",
    "bi-filetype-php": "\uf757",
    "bi-filetype-png": "\uf758",
    "bi-filetype-ppt-1": "\uf759",
    "bi-filetype-ppt": "\uf75a",
    "bi-filetype-psd": "\uf75b",
    "bi-filetype-py": "\uf75c",
    "bi-filetype-raw": "\uf75d",
    "bi-filetype-rb": "\uf75e",
    "bi-filetype-sass": "\uf75f",
    "bi-filetype-scss": "\uf760",
    "bi-filetype-sh": "\uf761",
    "bi-filetype-svg": "\uf762",
    "bi-filetype-tiff": "\uf763",
    "bi-filetype-tsx": "\uf764",
    "bi-filetype-ttf": "\uf765",
    "bi-filetype-txt": "\uf766",
    "bi-filetype-wav": "\uf767",
    "bi-filetype-woff": "\uf768",
    "bi-filetype-xls-1": "\uf769",
    "bi-filetype-xls": "\uf76a",
    "bi-filetype-xml": "\uf76b",
    "bi-filetype-yml": "\uf76c",
    "bi-heart-arrow": "\uf76d",
    "bi-heart-pulse-fill": "\uf76e",
    "bi-heart-pulse": "\uf76f",
    "bi-heartbreak-fill": "\uf770",
    "bi-heartbreak": "\uf771",
    "bi-hearts": "\uf772",
    "bi-hospital-fill": "\uf773",
    "bi-hospital": "\uf774",
    "bi-house-heart-fill": "\uf775",
    "bi-house-heart": "\uf776",
    "bi-incognito": "\uf777",
    "bi-magnet-fill": "\uf778",
    "bi-magnet": "\uf779",
    "bi-person-heart": "\uf77a",
    "bi-person-hearts": "\uf77b",
    "bi-phone-flip": "\uf77c",
    "bi-plugin": "\uf77d",
    "bi-postage-fill": "\uf77e",
    "bi-postage-heart-fill": "\uf77f",
    "bi-postage-heart": "\uf780",
    "bi-postage": "\uf781",
    "bi-postcard-fill": "\uf782",
    "bi-postcard-heart-fill": "\uf783",
    "bi-postcard-heart": "\uf784",
    "bi-postcard": "\uf785",
    "bi-search-heart-fill": "\uf786",
    "bi-search-heart": "\uf787",
    "bi-sliders2-vertical": "\uf788",
    "bi-sliders2": "\uf789",
    "bi-trash3-fill": "\uf78a",
    "bi-trash3": "\uf78b",
    "bi-valentine": "\uf78c",
    "bi-valentine2": "\uf78d",
    "bi-wrench-adjustable-circle-fill": "\uf78e",
    "bi-wrench-adjustable-circle": "\uf78f",
    "bi-wrench-adjustable": "\uf790",
    "bi-filetype-json": "\uf791",
    "bi-filetype-pptx": "\uf792",
    "bi-filetype-xlsx": "\uf793"
}

function icon_to_unicode(icon_class) {
    if (icon_class == null || icon_class === undefined || icon_class.trim().length == 0)
        return ""

    if (icon_class.trim().startsWith("bi"))
        return try_get(bs_unicode_map, icon_class, "").charAt(0)
    else if (icon_class.trim().startsWith("fa") && icon_class.trim().includes(" ")) {
        c = icon_class.split(" ")[1]
        if (c.includes("-")) {
            c = c.substring(c.indexOf('-') + 1, c.length)
            return try_get(fa_unicode_map, c, "").charAt(0)
        }
    }

    return ""
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