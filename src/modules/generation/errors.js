class GeneratorError extends Error {
  constructor(message, code, meta = {}) {
    super(message);
    this.name = 'GeneratorError';
    this.code = code;
    Object.assign(this, meta);
  }
}

module.exports = {
  GeneratorError,
};

