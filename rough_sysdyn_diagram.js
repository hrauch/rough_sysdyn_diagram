/*
 * rough_sysdyn_diagram.js
 * 
 * Author: Hans Rauch
 * License: MIT License
 * Created: 2022-09-06
 * Last modified: 2022-09-11
 * Version: 0.81
 *
 * Draws System Dynamics diagrams in rough mode.
*/
 
const URL_SNS = "http://www.w3.org/2000/svg"

// Positions for connections between nodes
const TOP = 1
const RIGHT = 3
const BOTTOM = 5
const LEFT = 7
const CENTER = 0

// https://www.heise.de/tipps-tricks/JavaScript-Sleep-und-setTimeout-4060840.html
function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function show_info(obj, info) {
    obj.innerHTML = info
}

class RoughSdDraw {

    canvas_name = ''
    svg = null      // canvas
    rc = null       // using the roughjs library
    popover = null  // popovers by bootstrap
    font_family = "'Architects Daughter', sans-serif"
    font_height = 24
    l_width = 100   // Level geometry
    l_height = 60
    l_flow = 65
    a_width = 15
    c_radius = 20   // Const geometry
    preview_color = '#e0e0e0'
    base_color = '#d0d0ff'
    cloud_color = '#4040dd'
    level_color = this.base_color
    rate_color = this.base_color
    constant_color = '#2020cc'
    aux_color = this.base_color
    smooth_color = this.base_color
    d3_color = this.base_color
    table_color = this.base_color
    timeout = 1000
    is_locked = false
    obj_elements = {        // drawing elements per object
        'Cloud_in': 1, 'Cloud_out': 1,
        'Level': 2, 'Aux': 2,
        'Const': 3, 'Smooth': 3, 'D3': 3, 'Conn': 3,
        'Table': 4,
        'Rate_in': 5, 'Rate_out': 5
    }


    constructor(canvas_name) {
        this.canvas_name = canvas_name
        this.info = document.getElementById(canvas_name + "_info")
        this.svg = document.getElementById(canvas_name)
        this.rc = rough.svg(this.svg)
    }

    lock (mode) {
        this.is_locked = mode
        let btn = null
        btn = document.getElementById(this.canvas_name + '_btn_prev')
        btn.disabled = mode
        btn = document.getElementById(this.canvas_name + '_btn_next')
        btn.disabled = mode
    }

    get_popover(title, info) {
        // create bootstrap popover
        let link = document.createElementNS(URL_SNS, "a");
        link.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', 'javascript://');
        link.setAttributeNS(null,"tabindex", "0")
        link.setAttributeNS(null,"class", "d-inline-block")
        link.setAttributeNS(null,"data-bs-custom-class", "custom-popover")
        link.setAttributeNS(null,"data-bs-placement", "top")
        link.setAttributeNS(null,"data-bs-toggle", "popover")
        link.setAttributeNS(null,"data-bs-trigger", "focus")
        link.setAttributeNS(null,"data-bs-title", title)
        link.setAttributeNS(null,"data-bs-content", info)
        this.popover = new bootstrap.Popover(link)
        return this.svg.appendChild(link)
    }

    draw_title(svg, x, y, title, position, stroke='black') {
        // Draw title for the different nodes
        svg = document.createElementNS(URL_SNS, 'text')
        let l = 0
        switch (position) {
            case TOP:
                y -= this.font_height
                break
            case RIGHT:
                l = title.length
                x += l * this.font_height / 3
                break
            case BOTTOM:
                y += this.font_height * 4 / 3
                break
            case LEFT:
                l = title.length
                x -= l * this.font_height / 3
                break
        }
        svg.setAttributeNS(null,"x", x)
        svg.setAttributeNS(null,"y", y)
        svg.setAttributeNS(null,"stroke", stroke)
        svg.setAttributeNS(null,"dy", this.font_height / 4)
        svg.setAttributeNS(null, "font-size", this.font_height)
        svg.setAttributeNS(null, "font-family", this.font_family)
        svg.setAttributeNS(null, "text-anchor", "middle")
        svg.innerHTML = title
        return svg
    }

    draw_cloud(xy, direction) {
        let cloud = this.svg
        let cx = 0
        if (direction == 1) {
            cx = xy.x + this.l_width / 2 + this.l_flow + this.a_width + 50 / 2
        } else {
            cx = xy.x - this.l_width / 2 - this.l_flow - this.a_width - 50 / 2
        }
        let svg_cloud = this.rc.circle(cx, xy.y, this.l_height, {fill: this.cloud_color, stroke: 'transparent', fillStyle: 'dots'})
        cloud.appendChild(svg_cloud)
        return cloud
    }

    draw_cloud_in(xy) {
        return this.draw_cloud(xy, -1)
    }

    draw_cloud_out(xy) {
        return this.draw_cloud(xy, +1)
    }

    do_lock(stroke) {
        if (stroke == this.preview_color) {
            this.lock(true)
        }
    }

    remove_children (name) {
        let n = 0
        while (n < this.obj_elements[name]) {
            this.svg.removeChild(this.svg.lastChild)
            n += 1
        }
        this.lock(false)
    }

    draw_level_colored(title, xy, fill=this.preview_color, stroke=this.preview_color) {
        this.do_lock(stroke)
        let level = this.svg
        let svg_level = null

        let x0 = xy.x - this.l_width / 2
        let y0 = xy.y - this.l_height / 2
        svg_level = this.rc.rectangle(x0, y0, this.l_width, this.l_height,
            {fill: this.preview_color, stroke: fill})
        level.appendChild(svg_level)
        level.appendChild(this.draw_title(svg_level, xy.x, xy.y, title, CENTER, stroke))
        return level
    }

    draw_level(title, xy) {
        this.remove_children('Level')
        return this.draw_level_colored(title, xy, this.level_color, 'black')
    }

    draw_flow(xy, direction) {
        let arrow = this.svg
        let svg_flow = null
        let x1 = 0
        const a_length = 15 // arrow length

        // rough flow
        let yh = xy.y + - 5
        let x0 = 0
        if (direction == 1) {
            x0 = xy.x + this.l_width / 2
            x1 = x0 + this.l_flow
        } else {
            x0 = xy.x - this.l_width / 2 -this.l_flow - a_length
            x1 = x0 + this.l_flow
        }
        svg_flow = this.rc.line(x0, yh, x1, yh, {strokeWidth: 2})
        arrow.appendChild(svg_flow)
        yh += 10
        svg_flow = this.rc.line(x0, yh, x1, yh, {strokeWidth: 2})
        arrow.appendChild(svg_flow)
        // arrow left
        yh -= 5
        svg_flow = this.rc.line(x1 + a_length, yh, x1-10, yh - a_length, {strokeWidth: 3})
        arrow.appendChild(svg_flow)
        svg_flow = this.rc.line(x1 + a_length, yh, x1-10, yh + a_length, {strokeWidth: 3})
        arrow.appendChild(svg_flow)
        return arrow
    }

    draw_flow_in(xy) {
        return this.draw_flow(xy, -1)
    }

    draw_flow_out(xy) {
        return this.draw_flow(xy, 1)
    }

    draw_rate(xy, direction) {
        let rate = this.svg
        let svg_rate = null
        let x0 = 0
        let y0 = 0
        let x1 = 0
        let y1 = 0
        let p = ''
        if (direction == 1) {
            x0 = xy.x + this.l_width / 2 + this.a_width
            x1 = x0 + 2 * this.a_width
        } else {
            x0 = xy.x - this.l_width / 2 - this.a_width - this.l_width / 2
            x1 = x0 + 2 * this.a_width
        }
        y0 = xy.y - this.l_height / 3
        y1 = xy.y + this.l_height / 3

        p = 'M ' + x0 + ' ' + y0 + ' ' + x1 + ' ' + y0 + ' ' + x0 + ' ' + y1 + ' ' + x1 + ' ' + y1 + '  Z'
        svg_rate = this.rc.path(p, {fill: this.rate_color})
        rate.appendChild(svg_rate)
        return rate

    }

    draw_rate_out(xy) {
        this.draw_flow(xy, 1)
        this.draw_rate(xy, 1)
    }

    draw_rate_in(xy) {
        this.draw_flow(xy, -1)
        this.draw_rate(xy, -1)
    }

    draw_constant_colored(title, xy, position, fill=this.preview_color, stroke=this.preview_color) {
        this.do_lock(stroke)
        let constant = this.svg
        let svg_constant = null
        svg_constant= this.rc.circle(xy.x, xy.y, this.c_radius, {fill: fill})
        constant.appendChild(svg_constant)
        svg_constant = this.rc.line(xy.x - this.c_radius + 5, xy.y, xy.x + this.c_radius - 5, xy.y,
            {stroke:stroke, strokeWidth: 2})
        constant.appendChild(svg_constant)
        constant.appendChild(this.draw_title(svg_constant, xy.x, xy.y, title, position, stroke))
        return constant

    }

    draw_constant(title, xy, position) {
        this.remove_children('Const')
        return this.draw_constant_colored(title, xy, position, this.constant_color, 'black')
    }

    draw_aux_colored (title, xy, fill=this.preview_color, stroke=this.preview_color) {
        this.do_lock(stroke)
        let aux = this.svg
        let svg_aux = null

        let x0 = xy.x - this.l_width / 2
        let y0 = xy.y - this.l_height / 2
        let x1 = xy.x + this.l_width / 2
        let y1 = xy.y + this.l_height / 2
        let p = 'M ' + x0 + ' ' + y0 + ' ' + x1 + ' ' + y0 + ' ' + x1 + ' ' + y0 + ' '
        p += x1 + this.c_radius + ' ' + xy.y + ' ' + x1 + ' ' + y1 + ' ' + x0 + ' ' + y1 + ' '
        p += x0 - this.c_radius + ' ' + xy.y + 'Z'
        svg_aux = this.rc.path(p, {fill: fill})
        aux.appendChild(svg_aux)
        aux.appendChild(this.draw_title(svg_aux, xy.x, xy.y, title, CENTER, stroke))
        return aux
    }

    draw_aux (title, xy) {
        this.remove_children('Aux')
        return this.draw_aux_colored(title, xy, this.aux_color, 'black')
    }

    draw_smooth_colored(title, xy, position, fill=this.preview_color, stroke=this.preview_color) {
        this.do_lock(stroke)
        let points = []
        let smooth = this.svg
        let svg_smooth = null
        svg_smooth = this.rc.rectangle(xy.x - this.a_width, xy.y - this.a_width, 2 * this.a_width, 2 * this.a_width,
            {fill: fill, stroke: stroke})
        smooth.appendChild(svg_smooth)
        svg_smooth = this.rc.line(xy.x - this.a_width, xy.y + this.a_width, xy.x + this.a_width, xy.y - this.a_width,
            {strokeWidth: 2, stroke: stroke})
        smooth.appendChild(svg_smooth)
        smooth.appendChild(this.draw_title(svg_smooth, xy.x, xy.y, title, position, stroke))
        return smooth
    }

    draw_smooth (title, xy, position) {
        this.remove_children('Smooth')
        return this.draw_smooth_colored(title, xy, position, this.smooth_color, 'black')
    }

    draw_d3_colored (title, xy, position, fill=this.preview_color, stroke=this.preview_color) {
        this.do_lock(stroke)
        let points = []
        let d3 = this.svg
        let svg_d3 = null
        svg_d3= this.rc.rectangle(xy.x - this.a_width, xy.y - this.a_width, 2 * this.a_width, 2 * this.a_width,
            {fill: fill, stroke: stroke})
        d3.appendChild(svg_d3)
        points.push ([xy.x - this.a_width, xy.y + this.a_width])
        points.push ([xy.x - 1 , xy.y + 5])
        points.push ([xy.x + 1 , xy.y - 5])
        points.push ([xy.x + this.a_width, xy.y - this.a_width])
        svg_d3 = this.rc.curve(points, {strokeWidth: 2, stroke: stroke})
        d3.appendChild(svg_d3)
        d3.appendChild(this.draw_title(svg_d3, xy.x, xy.y, title, position, stroke))
        return d3
    }

    draw_d3 (title, xy, position) {
        this.remove_children('D3')
        return this.draw_d3_colored(title, xy, position, this.d3_color, 'black')
    }

    draw_table_colored (title, xy, position, fill=this.preview_color, stroke=this.preview_color) {
        this.do_lock(stroke)
        let table = this.svg
        let svg_table = null
        svg_table = this.rc.rectangle(xy.x - this.a_width, xy.y - this.a_width, 2 * this.a_width, 2 * this.a_width,
            {fill: this.constant_color, stroke: stroke})
        table.appendChild(svg_table)
        svg_table = this.rc.line(xy.x - this.a_width, xy.y, xy.x + this.a_width, xy.y, {strokeWidth: 2, stroke: stroke})
        table.appendChild(svg_table)
        svg_table = this.rc.line(xy.x, xy.y - this.a_width, xy.x, xy.y + 15, {strokeWidth: 2, stroke: stroke})
        table.appendChild(svg_table)
        table.appendChild(this.draw_title(svg_table, xy.x, xy.y, title, position, stroke))
        return table
    }

    draw_table (title, xy, position) {
        this.remove_children('Table')
        return this.draw_table_colored(title, xy, position, this.table_color, 'black')
    }

    draw_arrow (x, y, vb, stroke=this.preview_color) {
        // Arrow for curved line
        let l = null
        let a_left = vb - 0.125 * Math.PI
        let a_right = vb + 0.125 * Math.PI
        let a_length = 20
        l = this.rc.line(x, y, x - a_length * Math.cos(a_left), y - a_length * Math.sin(a_left),
            {stroke: stroke, strokeWidth: 2})
        this.svg.appendChild(l)
        l = this.rc.line(x, y, x - a_length * Math.cos(a_right), y - a_length * Math.sin(a_right),
            {stroke: stroke, strokeWidth: 2})
        this.svg.appendChild(l)
    }

    draw_curved_line_colored (xy_from, xy_to, bend, with_arrow = true, stroke_width=1,
                              stroke=this.preview_color) {
        // create and draw connection
        this.do_lock(stroke)
        if (xy_from == xy_to) { return }
        let A = xy_from
        let C = xy_to
        let dx = C.x - A.x
        let dy = C.y - A.y
        // Base point for center perpendicular
        let Bac = {x: A.x + dx /2, y: A.y + dy / 2}
        let vb = Math.atan(dy / dx) + Math.PI / 2
        let factor = 1
        if (dx >= 0) { factor = -1}
        let B = {x: Bac.x + factor * bend * Math.cos(vb), y: Bac.y + factor * bend * Math.sin(vb)}
        let points = [[A.x, A.y], [B.x, B.y], [C.x, C.y]]
        if (stroke == this.preview_color) {
            this.svg.appendChild(this.rc.curve(points, {stroke: stroke, strokeWidth: 1}))
        } else {
            if (stroke_width == 1) {
                this.svg.appendChild(this.rc.curve(points, {stroke: 'grey', strokeWidth: stroke_width}))
            } else {
                this.svg.appendChild(this.rc.curve(points, {stroke: 'black', strokeWidth: stroke_width, roughness: 2.2}))
            }
        }
        if (with_arrow) {
            // draw arrow
            vb = Math.atan((C.y - B.y) / (C.x - B.x))
            let factor = 1
            if (C.x - B.x >= 0) { factor = 0}
            this.draw_arrow(C.x, C.y, vb + factor * Math.PI, stroke)
        }
    }

    draw_curved_line (xy_from, xy_to, bend, with_arrow = true, stroke_width=1) {
        this.svg.removeChild(this.svg.lastChild)
        this.svg.removeChild(this.svg.lastChild)
        this.svg.removeChild(this.svg.lastChild)
        this.lock(false)
        return this.draw_curved_line_colored(xy_from, xy_to, bend, with_arrow, stroke_width, 'black')
    }
}

class RoughSd extends RoughSdDraw {
    
    // Models have nodes and connecttions; with delay, text and wait yout control the visualisation
    model = {}
    model_keys = []
    n_curr = 0

    constructor(canvas_name) {
        super(canvas_name)
    }

    generate_id(value){
        value = value.toLowerCase();
        value = value.replace(/ä/g, 'ae');
        value = value.replace(/ö/g, 'oe');
        value = value.replace(/ü/g, 'ue');
        value = value.replace(/ß/g, 'ss');
        value = value.replace(/ /g, '_');
        value = value.replace(/\./g, '_');
        value = value.replace(/,/g, '_');
        value = value.replace(/\(/g, '_');
        value = value.replace(/\)/g, '_');
        return value;
    }

    get_connectors(obj, x, y) {
        // The connectors depends on geometry
        let x0, x1, y0 , y1
        let left = {x: x, y: y}
        let bottom = {x: x, y: y}
        let right = {x: x, y: y}
        let top = {x: x, y: y}
        switch (obj) {
            case 'Level':
            case 'Aux':
                x0 = x - this.l_width / 2
                y0 = y - this.l_height / 2
                x1 = x + this.l_width / 2
                y1 = y + this.l_height / 2
                left.x -= this.l_width / 2
                right.x += this.l_width / 2
                if (obj == 'Aux') {
                    left.x -= this.c_radius
                    right.x += this.c_radius
                }
                top.y -= this.l_height / 2
                bottom.y += this.l_height / 2
                break
            case 'Rate_in':
                x -= this.l_width * 3 / 2 + 2 * this.a_width
                x0 = x + this.l_width / 2 + this.a_width
                y0 = y - this.c_radius
                x1 = x0 + 2 * this.a_width
                y1 = y + this.c_radius
                left = {x: x, y: y}
                right = {x: x, y: y}
                top = {x: x0 + this.a_width, y: y0}
                bottom = {x: x0 + this.a_width, y: y1}
                break
            case 'Rate_out':
                x0 = x + this.l_width / 2 + this.a_width
                y0 = y - this.c_radius
                x1 = x0 + 2 * this.a_width
                y1 = y + this.c_radius
                left = {x: x, y: y}
                right = {x: x, y: y}
                top = {x: x0 + this.a_width, y: y0}
                bottom = {x: x0 + this.a_width, y: y1}
                break
            case 'Const':
                x0 = x - 0.7 * this.c_radius / 2
                y0 = y - 0.7 * this.c_radius / 2
                x1 = x + 0.7 * this.c_radius / 2
                y1 = y + 0.7 * this.c_radius / 2
                left.x = x0
                right.x = x1
                top.y = y0
                bottom.y = y1
                break
            case 'Smooth':
            case 'D3':
            case 'Table':
                x0 = x - this.a_width
                y0 = y - this.a_width
                x1 = x + this.a_width
                y1 = y + this.a_width
                left.x = x0
                right.x = x1
                top.y = y0
                bottom.y = y1
                break
        }
        return {
            left: left,
            right: right,
            top: top,
            bottom: bottom
        }
    }

    add_obj (obj, title, x, y, position, info='') {
        let id = this.generate_id(title)
        let conn =  this.get_connectors(obj, x, y)
        this.model[id] = {
            id: id,
            obj: obj,
            title: title,
            position: position,
            xy: {x: x, y: y},
            info: info,
            // 4 connectors
            left: conn.left,
            right: conn.right,
            top: conn.top,
            bottom: conn.bottom
        }
        return this.model[id]
    }

    add_level (title, x, y, rate_in, rate_out, cloud_in=true, cloud_out=true, info='') {
        let node = this.add_obj('Level', title, x, y, CENTER, info)
        node.in_rate = null
        node.out_rate = null
        node.in_cloud = null
        node.out_cloud = null
        if (rate_in) {
            node.in_rate = this.add_obj('Rate_in', title + '_in', x, y, null)
            if (cloud_in) {
                node.in_cloud = this.add_obj('Cloud_in', title + '_cloud_in', x, y, null)
            }
        }
        if (rate_out) {
            node.out_rate = this.add_obj('Rate_out', title + '_out', x, y, null)
            if (cloud_out) {
                node.out_cloud = this.add_obj('Cloud_out', title + '_cloud_out', x, y, null)
            }
        }
        return node
    }

    add_connection (id, xy_from, xy_to, bend, stroke_width, info) {
        this.model[id] = {
            id: id,
            obj: 'Conn',
            xy_from: xy_from,
            xy_to: xy_to,
            info: info,
            bend: bend,
            stroke_width: stroke_width
        }
    }

    draw_obj (obj) {
        let timeout = this.timeout
        if (obj.info != '') {
            show_info(this.info, obj.info)
        } else {
            timeout = 0
        }
        switch (obj.obj) {
            case 'Level':
                this.draw_level_colored(obj.title, obj.xy)
                setTimeout(this.draw_level.bind(this), timeout, obj.title, obj.xy);
                break
            case 'Const':
                this.draw_constant_colored(obj.title, obj.xy, obj.position)
                setTimeout(this.draw_constant.bind(this), timeout, obj.title, obj.xy, obj.position);
                break
            case 'Rate_in':
                this.draw_rate_in(obj.xy)
                break
            case 'Rate_out':
                this.draw_rate_out(obj.xy)
                break
            case 'Cloud_in':
                this.draw_cloud_in(obj.xy)
                break
            case 'Cloud_out':
                this.draw_cloud_out(obj.xy)
                break
            case 'Aux':
                this.draw_aux_colored(obj.title, obj.xy)
                setTimeout(this.draw_aux.bind(this), timeout, obj.title, obj.xy);
                break
            case 'Smooth':
                this.draw_smooth_colored(obj.title, obj.xy, obj.position)
                setTimeout(this.draw_smooth.bind(this), timeout, obj.title, obj.xy, obj.position);
                break
            case 'D3':
                this.draw_d3_colored(obj.title, obj.xy, obj.position)
                setTimeout(this.draw_d3.bind(this), timeout, obj.title, obj.xy, obj.position);
                break
            case 'Table':
                this.draw_table_colored(obj.title, obj.xy, obj.position)
                setTimeout(this.draw_table.bind(this), timeout, obj.title, obj.xy, obj.position);
                break
            case 'Conn':
                this.draw_curved_line_colored(obj.xy_from, obj.xy_to, obj.bend, true, obj.stroke_width)
                setTimeout(this.draw_curved_line.bind(this), timeout, obj.xy_from, obj.xy_to, obj.bend, true, obj.stroke_width);
                break
            case 'Text':
                this.info.innerHTML = obj.info
                break
            case 'Delay':
                break
            case 'Wait':
                break
        }
    }

    draw_obj_direct (obj) {
        let timeout = this.timeout
        if (obj.info != '') {
            show_info(this.info, obj.info)
        } else {
            timeout = 0
        }
        switch (obj.obj) {
            case 'Level':
                this.draw_level_colored(obj.title, obj.xy, this.level_color, 'black')
                break
            case 'Const':
                this.draw_constant_colored(obj.title, obj.xy, obj.position, this.constant_color, 'black')
                break
            case 'Rate_in':
                this.draw_rate_in(obj.xy)
                break
            case 'Rate_out':
                this.draw_rate_out(obj.xy)
                break
            case 'Cloud_in':
                this.draw_cloud_in(obj.xy)
                break
            case 'Cloud_out':
                this.draw_cloud_out(obj.xy)
                break
            case 'Aux':
                this.draw_aux_colored(obj.title, obj.xy, this.aux_color, 'black')
                break
            case 'Smooth':
                this.draw_smooth_colored(obj.title, obj.xy, obj.position, this.smooth_color, 'black')
                break
            case 'D3':
                this.draw_d3_colored(obj.title, obj.xy, obj.position, this.d3_color, 'black')
                break
            case 'Table':
                this.draw_table_colored(obj.title, obj.xy, obj.position, this.table_color, 'black')
                break
            case 'Conn':
                this.draw_curved_line_colored(obj.xy_from, obj.xy_to, obj.bend, true, obj.stroke_width, 'black')
                break
            case 'Text':
                this.info.innerHTML = obj.info
                break
            case 'Delay':
                break
            case 'Wait':
                break
        }
    }

    async draw_model () {
        for (let key in this.model) {
            let obj = this.model[key]
            if (obj.obj == 'Delay') {
                await sleep(1000 * obj.time_span)
            } else {
                this.draw_obj_direct(obj)
            }
        }
    }

    draw_next_obj() {
        if (this.n_curr < this.model_keys.length) {
            this.draw_obj(this.model[this.model_keys[this.n_curr]])
            this.n_curr += 1
        }
    }

    draw_prev_obj() {
        if (this.n_curr > 0) {
            this.n_curr -= 1
            let key = this.model_keys[this.n_curr]
            let obj = this.model[key]
            let elements = 0
            if (obj.obj in this.obj_elements) {
                elements = this.obj_elements[obj.obj]
            } else {
                switch (obj.obj) {
                    case 'Text':
                        this.draw_prev_obj()
                        this.info.innerHTML = ''
                        break
                    case 'Delay':
                        this.draw_prev_obj()
                        break
                }
            }
            while (elements > 0) {
                this.svg.removeChild(this.svg.lastChild)
                elements -= 1
            }
            this.info.innerHTML = ''
        }
    }

    string_to_obj(arr) {
        let name = this.generate_id (arr[0])
        if (arr.length == 2) {
            return this.model[name][arr[1]]
        } else if (arr.length == 3) {
            return this.model[name][arr[1]][arr[2]]
        } else {
            return this.model[name][arr[1]][arr[2]][arr[3]]
        }
    }

    create_sd_model (model, do_draw=true) {
        let id = ''
        let delay = 0
        let conn = 0
        let text = 0
        let time_span = 0.0
        for (let obj of model) {
            time_span = parseFloat(obj)
            if (isNaN(time_span)) {
                switch (obj[0]) {
                    case 'Level':
                        this.add_level(obj[1], obj[2], obj[3], obj[4], obj[5], obj[6], obj[7], obj[8])
                        break
                    case 'Const':
                    case 'Smooth':
                    case 'D3':
                    case 'Table':
                        this.add_obj(obj[0], obj[1], obj[2], obj[3], obj[4], obj[5])
                        break
                    case 'Aux':
                        this.add_obj(obj[0], obj[1], obj[2], obj[3], CENTER, obj[4])
                        break
                    case 'Info':
                        id = 'Text_' + text
                        this.model[id] = {obj: 'Text', id: id, info: obj[1]}
                        text += 1
                        break
                    case 'Delay':
                        id = 'Delay_' + delay
                        this.model[id] = {obj: 'Delay', id: id, time_span: obj[1]}
                        text += 1
                        break
                    default:
                        let xy_from = this.string_to_obj(obj[0].split('.'))
                        let xy_to = this.string_to_obj(obj[1].split('.'))
                        const bend = parseInt(obj[2])
                        let info = ''
                        let stroke_width = 1
                        if (obj.length >= 4) {
                            stroke_width = parseInt((obj[3]))
                            if (isNaN(stroke_width)) {
                                info = obj[3]
                            }
                        }
                        if (obj.length >= 5) {
                            info = obj[4]
                        }
                        id = 'Conn_' + conn
                        this.add_connection(id, xy_from, xy_to, bend, stroke_width, info)
                        conn += 1
                }
            } else {
                id = 'Delay_' + delay
                if (time_span < 0) {
                    this.model[id] = {obj: 'Wait', id: id}
                } else {
                    this.model[id] = {obj: 'Delay', id: id, time_span: time_span}
                }
                delay += 1
            }
        }
        for (let key in this.model) {
            this.model_keys.push(key)
        }
        if (do_draw) {
            this.timeout = 0
            this.draw_model()
        }
    }
}
