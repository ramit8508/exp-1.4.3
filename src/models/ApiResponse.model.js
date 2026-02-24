class ApiResponse {
  static success(data, message = 'Success', meta = {}) {
    return {
      success: true,
      message,
      data,
      ...meta
    };
  }

  static error(message = 'Error occurred', errors = [], statusCode = 500) {
    return {
      success: false,
      message,
      errors: Array.isArray(errors) ? errors : [errors],
      statusCode
    };
  }

  static created(data, message = 'Resource created successfully') {
    return {
      success: true,
      message,
      data
    };
  }

  static noContent(message = 'No content') {
    return {
      success: true,
      message
    };
  }

  static pagination(data, page, limit, total) {
    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }
}

module.exports = ApiResponse;
