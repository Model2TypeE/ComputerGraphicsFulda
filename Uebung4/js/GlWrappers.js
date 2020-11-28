class ConstantBuffer {
    constructor(gl, type, data, usage, attribLoc, attribType, attribLen) {
        this.gl = gl;
        this.type = type;
        this.data = data;
        this.usage = usage;

        this.attribType = attribType;
        this.attribLen = attribLen;
        this.attribLoc = attribLoc

        this.buffer = gl.createBuffer();
        this.Update(type, data, usage);
    }

    // why the fuck are there no destructors in javascript
    Destroy() {
        this.gl.deleteBuffer(this.buffer);
    }

    Update(type, data, usage) {
        this.gl.bindBuffer(type, this.buffer);
        this.gl.bufferData(type, data, usage);
    }

    Bind() {
        this.gl.bindBuffer(this.type, this.buffer);
        if (this.attribType) this.EnableInputLayout();
    }

    EnableInputLayout() {
        this.gl.vertexAttribPointer(this.attribLoc, this.attribLen, this.attribType, false, 0, 0);
        this.gl.enableVertexAttribArray(this.attribLoc);
    }

    DisableInputLayout() {
        this.gl.disableVertexAttribArray(this.attribLoc);
    }
}

class ShaderProgram {
    constructor(gl, vsSource, fsSource) {
        function createShader(gl, type, source) {
            var shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            return shader;
        };

        function createProgram(gl, vsSource, fsSource) {
            var vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
            var fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

            if (vs && fs) {
                var program = gl.createProgram();
                gl.attachShader(program, vs);
                gl.attachShader(program, fs);
                gl.linkProgram(program);

                if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                    console.warn("Could not	link program: " + gl.getProgramInfoLog(program));
                    return null;
                }
                return program;
            }
            return null;
        };

        this.gl = gl;
        this.program = createProgram(gl, vsSource, fsSource);
    }

    Destroy() {
        var shaders = this.gl.getAttachedShaders(this.program);
        for (var i = 0; i < shaders.length; ++i) {
            var shader = shaders[i];
            gl.detachShader(this.program, shader);
            gl.deleteShader(shader);
        }
        gl.deleteProgram(this.shaderProgram);
    }

    GetUnifLoc(unifName) {
        return this.gl.getUniformLocation(this.program, unifName);
    }

    GetAttrLoc(attrName) {
        return this.gl.getAttribLocation(this.program, attrName);
    }

    SetActive() {
        this.gl.useProgram(this.program)
    }
}