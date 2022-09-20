"""
generate_sys_dyn_diagram.py

Generates system dynamics diagramm in HTML format based on input file

Hans Rauch
(c) MIT LICENSE
2022-09-15 / 2022-09-20
Version 0.80
"""

import random
import re
import sys
from easydict import EasyDict as edict

model_vars = edict({})
connections = edict({})
sequence = []


def get_model_data(obj: dict, info: str) -> str:
    """
    Return the HTML-code for <obj> and <info>
    """

    def get_js(value: bool) -> str:
        """
        Return Javascript boolean
        """
        if value:
            return 'true'
        else:
            return 'false'

    line = f'           ["{obj.obj}", "{obj.title}", {30 * obj.x}, {30 * obj.y}'
    if obj.obj == 'Level':
        line += f', {get_js(obj.cloud_in)}, {get_js(obj.rate_out)}, {get_js(obj.cloud_in)}, {get_js(obj.cloud_out)}'
    elif obj.obj == 'Const':
        line += f', {obj.position}'
    else:
        assert False
    line_1 = line + f', "{info}"]'
    line += ']'
    return line, line_1


def get_connection_data(conn: dict, info: str)-> str:
    """
    Return HTML-code for <connection> and <info>
    """

    def get_name_position(obj: str) -> {str, str}:
        """
        Returns the name and the position of title
        """
        n_pos = obj.rfind('.')
        position = obj[n_pos+1:]
        name = obj[:n_pos]
        n_pos = name.rfind('.')
        if n_pos > 0:
            position = f'{name[n_pos+1:]}.{position}'
        return name, position

    def get_raw_name(name: str) -> str:
        """
        Returns the raw name of <name>
        """
        n_pos = name.find('.')
        if n_pos > 0:
            return name[:n_pos]
        else:
            return name

    conn.obj_from = conn.obj_from.replace('.in.', '.in_rate.').replace('.out.', '.out_rate.')
    conn.obj_to = conn.obj_to.replace('.in.', '.in_rate.').replace('.out.', '.out_rate.')
    from_name, from_position = get_name_position(conn.obj_from)
    to_name, to_position = get_name_position(conn.obj_to)
    m_from = model_vars[get_raw_name(from_name)]
    m_to = model_vars[get_raw_name(to_name)]
    line = f'           ["{m_from.title}.{from_position}", "{m_to.title}.{to_position}", {5 * conn.bend}, {conn.strength}'
    line_1 = line + f', "{info}"]'
    line += ']'
    return line, line_1


def get_info_data(delay: int, info: str) -> str:
    """
    Return the HTML-code for <delay> and <info>
    """
    line = f'           ["Info", "{info}"]'
    return line, line


def generate_html(sequence: list) -> str:
    """
    Creates HTML block
    """
    UID = 'r' + str(random.random())[2:11]
    model_0 = ''
    model_1 = ''
    model_2 = ''

    for obj in sequence:
        id = obj[0]
        delay = obj[1]
        info = obj[2]
        if id in model_vars:
            line_0, line_1 = get_model_data(model_vars[id], info)
        elif id in connections:
            line_0, line_1 = get_connection_data(connections[id], info)
        else:
            line_0, line_1 = get_info_data(delay, info)
        model_0 += f'{line_0},\n'
        model_1 += f'{line_1}, {delay},\n'
        model_2 += f'{line_1},\n'

    # HTML template
    data = f"""
        <!-- immediatly -->
        <div class="row mt-3">
            <div class="col-md-9">
                <svg id="svg_{UID}0" width="800px" height="600px" viewbox="0 0 800 600"></svg>
            </div>
        </div>
        <script>
            var svg_{UID}0_model = new RoughSd("svg_{UID}0")
            model = [
{model_0[:-2]}
            ]
            svg_{UID}0_model.create_sd_model(model)
        </script>

        ------------------------------------------------------

        <!--  as a film -->
        <div class="row mt-3">
            <div class="col-md-9">
                <svg id="svg_{UID}1" width="800px" height="600px" viewbox="0 0 800 600"></svg>
            </div>
            <div class="col-md-3">
                <div class="card" style="width: 18rem;">
                    <div class="card-body">
                        <h5 class="card-title">Hinweise zum Diagramm</h5>
                        <div id="svg_{UID}1_info">Bitte auf den Rechtspfeil klicken ...</div>
                    </div>
                </div>
            </div>
        </div>
        <script>
            var svg_{UID}_model = new RoughSd("svg_{UID}1")
            model = [
{model_1[:-2]}
            ]
            svg_{UID}1_model.create_sd_model(model)
        </script>

        -----------------------------------------------------------------

        <!-- stepwise -->
        <div class="row mt-3">
            <div class="col-md-9">
                <svg id="svg_{UID}2" width="800px" height="600px" viewbox="0 0 800 600"></svg>
            </div>
            <div class="col-md-3">
                <div class="col-12 mb-3">
                    <div class="btn-group" role="group" aria-label="forward / backward">
                        <button id="svg_{UID}2_btn_prev" class="btn btn-light" onclick="svg_{UID}2_model.draw_prev_obj()"><i class="fas fa-chevron-circle-left"></i></button>
                        <button id="svg_{UID}2_btn_next" class="btn btn-light" onclick="svg_{UID}2_model.draw_next_obj()"><i class="fas fa-chevron-circle-right"></i></button>
                    </div>
                </div>
                <div class="card" style="width: 18rem;">
                    <div class="card-body">
                        <h5 class="card-title">Hinweise zum Diagramm</h5>
                        <div id="svg_{UID}_info">Bitte auf den Rechtspfeil klicken ...</div>
                    </div>
                </div>
            </div>
        </div>
        <script>
            var svg_{UID}2_model = new RoughSd("svg_{UID}2")
            model = [
{model_2[:-2]}
            ]
            svg_{UID}2_model.create_sd_model(model, false)
        </script>
    """
    return data


def get_var_name(name: str) -> str:
    """
    Extracts the variable name
    """
    if name.lower() == 'true':
        name = 'true'
    elif name.lower() == 'false':
        name = 'false'
    elif name.lower() == 'none':
        name = 'null'
    return name


def generate_sd_diagram (model_raw):
    """
    Checks model_raw and creates HTML-page
    """

    def get_js_string(s: str) ->str:
        """
        Removes '"' from string
        """
        return s.strip().replace('"', "'")


    def get_name(line: str) -> {str, list}:
        """
        """
        n_pos = line.find('=')
        name = line[:n_pos].strip().lower()
        return name, line[n_pos+1:].split(':')

    def get_var(line: str, abs_x: float, abs_y: float) -> {float, float}:
        """
        Extracts variable
        """
        name, attrs = get_name(line)
        name = name.strip()
        obj = attrs[0].strip()
        s = attrs[1].split('|')
        title = s[0]
        if len(s) == 1:
            position = 'TOP'
        else:
            position = s[1].upper()
        xy = attrs[2].split(',')
        if attrs[2].find('+') >=0 or attrs[2].find('-') >= 0:
            x = abs_x + eval(xy[0])
            y = abs_y + eval(xy[1])
        else:
            x = eval(xy[0])
            y = eval(xy[1])
            abs_x = x
            abs_y = y
        cloud_in = False
        rate_in = False
        rate_out = False
        cloud_out = False
        if obj == 'Level':
            in_out = attrs[3].split(',')
            if len(in_out) == 2:
                if in_out[0].find('in') >= 0:
                    rate_in = True
                if in_out[0].find('cloud') >= 0:
                    cloud_in = True
                if in_out[1].find('out') >= 0:
                    rate_out = True
                if in_out[1].find('cloud') >= 0:
                    cloud_out = True
            else:
                in_out = in_out[0]
                if in_out.find('in') >= 0:
                    rate_in = True
                    if in_out.find('cloud') >= 0:
                        cloud_in = True
                elif in_out.find('out') >= 0:
                    rate_out = True
                    if in_out.find('cloud') >= 0:
                        cloud_out = True
        if not name in model_vars:
            if obj == 'Level':
                model_vars[name] = edict({
                    'id': name,
                    'obj': obj,
                    'title': title,
                    'x': x,
                    'y': y,
                    'cloud_in': cloud_in,
                    'rate_in': rate_in,
                    'rate_out': rate_out,
                    'cloud_out': cloud_out
                })
            else:
                model_vars[name] = edict({
                    'id': name,
                    'obj': obj,
                    'title': title,
                    'position': position,
                    'x': x,
                    'y': y
                })
        else:
            node = model_vars[name]
            sequence.append(name, node.delay, get_js_string(node.info))
        return abs_x, abs_y


    def get_info(line: str):
        """
        Extracts additional informations
        """
        name, attrs = get_name(line)
        n_pos = name.find('(')
        if n_pos > 0:
            delay = eval(name[n_pos+1:].replace(')', ''))
            name = name[:n_pos].strip()
        else:
            delay = 0
        model_vars[name]['info'] = attrs[0]
        model_vars[name]['delay'] = delay
        return name, delay, attrs[0]


    def get_y(node: str) -> int:
        """
        Get y-position of node
        """
        n_pos = node.find('.')
        if n_pos > 0:
            node = node[:n_pos]
        return model_vars[node].y


    def get_position(conn: str, position: str) -> {str, str}:
        """
        Gets the position of this connection
        """
        n_pos = conn.rfind('.')
        if n_pos > 0:
            last = conn[n_pos+1:]
            if last in ['top', 'bottom', 'left', 'right']:
                position = last
                conn = conn[:n_pos]
        return conn, position


    def add_connection(conn_from: str, conn_to: str, bend: int, strength: int=1):
        """
        Adds information for this connection
        """
        position = ''
        conn_from = conn_from.strip()
        conn_to = conn_to.strip()
        conn_from, position_from = get_position(conn_from, position)
        conn_to, position_to = get_position(conn_to, position)

        if conn_from in ['in', 'out']:
            conn_from = f'{conn_to}.{conn_from}'
        if conn_to in ['in', 'out']:
            conn_to = f'{conn_from}.{conn_to}'
        id = f'{conn_from}-{conn_to}'
        if not position_from and not position_to:
            y_from = get_y(conn_from)
            y_to = get_y(conn_to)
            if y_from < y_to:
                conn_from += '.bottom'
                conn_to += '.top'
            else:
                conn_from += '.top'
                conn_to += '.bottom'
        elif not position_from:
            conn_from += f'.{position_to}'
        elif not position_to:
            conn_to += f'.{position_from}'
        if position_from:
            conn_from += f'.{position_from}'
        if position_to:
            conn_to += f'.{position_to}'
        if not id in connections:
            connections[id] = edict({
                'id': id,
                'obj_from': conn_from,
                'obj_to': conn_to,
                'strength': strength,
                'bend': bend
            })
        else:
            sequence.append((id, 0, ''))

    def get_conn_info(line: str):
        """
        Extracts additional informations
        """
        name, attrs = get_name(line)
        n_pos = name.find('(')
        if n_pos > 0:
            delay = eval(name[n_pos+1:].replace(')', ''))
            name = name[:n_pos].strip()
        else:
            delay = 0
        return name, delay


    def get_connection(line: str):
        """
        Gets the connection declared in <line>
        """
        m = re.search('-*>', line)
        if m:
            s_right_arrow = line[m.start():m.end()]
            conn_from, conn_to = line.split(s_right_arrow)
            arr = conn_to.split(':')
            if len(arr) == 1:
                bend = 5
            else:
                conn_to = arr[0]
                bend = eval(arr[1])
            add_connection(conn_from, conn_to, bend, m.end() - m.start() - 1)
        elif line in model_vars or line in connections:
            sequence.append((line, 0, ''))
        else:
            m = re.search('\(\d*\)', line)
            if m:
                delay = eval(line[m.start():m.end()])
                info = line[m.end():].strip()
            else:
                delay = 0
                info = line.strip()
            sequence.append(('', delay, get_js_string(info)))


    abs_x = -1
    abs_y = -1
    lines = model_raw.split('\n')
    for line in lines:
        # Remove comments
        n_comment = line.find('#')
        if n_comment >= 0:
            line = line[:n_comment]
        line = line.strip()
        if line:
            n_pos = line.find('=')
            if n_pos > 0:
                m = re.search('-*>', line)
                if line.find(':') > n_pos:
                    # declaration of variable
                    abs_x, abs_y = get_var(line, abs_x, abs_y)
                elif not m:
                    # information for variable
                    id, delay, info  = get_info(line)
                    sequence.append((id, delay, get_js_string(info)))
                else:
                    # information for connection
                    info = line[n_pos+1:].strip()
                    line = line[:n_pos]
                    conn_from = line[:m.start()].strip()
                    line = line[m.end():]
                    name, delay = get_conn_info(line)
                    if name in['in', 'out']:
                        conn_to = f'{conn_from}.{name}'
                    else:
                        conn_to = name
                    id = f'{conn_from}-{conn_to}'
                    sequence.append((id, delay, get_js_string(info)))
            else:
                # connections
                get_connection(line)
    if not sequence:
        for name in model_vars:
            sequence.append((name, 0, ''))
        for name in connections:
            sequence.append((name, 0, ''))
    return generate_html(sequence)

# read input file and generate output file
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print ('Usage: python generate_sys_dyn_diagram.py <filename>')
    else:
        filename = sys.argv[1]
        n_pos = filename.rfind('.')
        if n_pos > 0:
            f_name = filename[:n_pos]
        else:
            f_name = filename
        f_name += '.html'

        with open(filename, 'r') as f:
            model_raw = f.read()
        sd_diagram_text = generate_sd_diagram(model_raw)
        with open(f_name, 'w') as f:
            f.write(sd_diagram_text)
        print (f'Result: {f_name}')
