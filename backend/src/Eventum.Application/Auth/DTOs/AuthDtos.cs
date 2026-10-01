namespace Eventum.Application.Auth.DTOs;

public record RegisterRequest(string Email, string Password, string FullName);

public record LoginRequest(string Email, string Password);

public record RefreshTokenRequest(string RefreshToken);

public record AuthResponse(
    UserDto User,
    string AccessToken,
    string RefreshToken
);

public record UserDto(
    Guid Id,
    string Email,
    string? FullName,
    string? AvatarUrl,
    List<string> Roles
);

public record UpdateProfileRequest(
    string? FullName,
    string? Email,
    string? CurrentPassword,
    string? NewPassword
);
