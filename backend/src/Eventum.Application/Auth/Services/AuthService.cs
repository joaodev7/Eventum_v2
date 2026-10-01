using Eventum.Application.Auth.DTOs;
using Eventum.Application.Common.Interfaces;
using Eventum.Domain.Entities;
using Eventum.Domain.Enums;
using Eventum.Domain.Exceptions;
using Eventum.Domain.Interfaces;

namespace Eventum.Application.Auth.Services;

public class AuthService : IAuthService
{
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<UserRole> _userRoleRepository;
    private readonly IRepository<RefreshToken> _refreshTokenRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public AuthService(
        IRepository<User> userRepository,
        IRepository<UserRole> userRoleRepository,
        IRepository<RefreshToken> refreshTokenRepository,
        IUnitOfWork unitOfWork,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _userRepository = userRepository;
        _userRoleRepository = userRoleRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, string? ipAddress, CancellationToken cancellationToken = default)
    {
        var existing = await _userRepository.FindAsync(u => u.Email.ToLower() == request.Email.ToLower(), cancellationToken);
        if (existing.Any())
        {
            throw new DomainException("An account with this email address already exists.");
        }

        var user = new User
        {
            Email = request.Email.Trim().ToLower(),
            PasswordHash = _passwordHasher.Hash(request.Password),
            FullName = request.FullName.Trim()
        };

        await _userRepository.AddAsync(user, cancellationToken);

        // Atribui role inicial de Admin (Organizador de evento)
        var role = new UserRole
        {
            UserId = user.Id,
            Role = AppRole.Admin
        };
        await _userRoleRepository.AddAsync(role, cancellationToken);

        var refreshTokenString = _jwtTokenGenerator.GenerateRefreshToken();
        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = refreshTokenString,
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            CreatedByIp = ipAddress
        };
        await _refreshTokenRepository.AddAsync(refreshToken, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var roles = new List<string> { AppRole.Admin.ToString().ToLower() };
        var accessToken = _jwtTokenGenerator.GenerateAccessToken(user, roles);

        return new AuthResponse(
            new UserDto(user.Id, user.Email, user.FullName, user.AvatarUrl, roles),
            accessToken,
            refreshTokenString
        );
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress, CancellationToken cancellationToken = default)
    {
        var users = await _userRepository.FindAsync(u => u.Email.ToLower() == request.Email.ToLower(), cancellationToken);
        var user = users.FirstOrDefault();
        if (user == null || !_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedDomainException("Invalid email or password.");
        }

        var userRoles = await _userRoleRepository.FindAsync(r => r.UserId == user.Id, cancellationToken);
        var roles = userRoles.Select(r => r.Role.ToString().ToLower()).ToList();
        if (!roles.Any())
        {
            roles.Add("user");
        }

        var refreshTokenString = _jwtTokenGenerator.GenerateRefreshToken();
        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = refreshTokenString,
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            CreatedByIp = ipAddress
        };
        await _refreshTokenRepository.AddAsync(refreshToken, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var accessToken = _jwtTokenGenerator.GenerateAccessToken(user, roles);

        return new AuthResponse(
            new UserDto(user.Id, user.Email, user.FullName, user.AvatarUrl, roles),
            accessToken,
            refreshTokenString
        );
    }

    public async Task<AuthResponse> RefreshTokenAsync(string token, string? ipAddress, CancellationToken cancellationToken = default)
    {
        var tokens = await _refreshTokenRepository.FindAsync(t => t.Token == token, cancellationToken);
        var existingToken = tokens.FirstOrDefault();

        if (existingToken == null || !existingToken.IsActive)
        {
            throw new UnauthorizedDomainException("Invalid or expired refresh token.");
        }

        var user = await _userRepository.GetByIdAsync(existingToken.UserId, cancellationToken);
        if (user == null)
        {
            throw new UnauthorizedDomainException("User not found.");
        }

        // Rotação do refresh token
        existingToken.IsRevoked = true;
        existingToken.RevokedByIp = ipAddress;

        var newRefreshTokenString = _jwtTokenGenerator.GenerateRefreshToken();
        existingToken.ReplacedByToken = newRefreshTokenString;

        var newRefreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = newRefreshTokenString,
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            CreatedByIp = ipAddress
        };

        await _refreshTokenRepository.AddAsync(newRefreshToken, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var userRoles = await _userRoleRepository.FindAsync(r => r.UserId == user.Id, cancellationToken);
        var roles = userRoles.Select(r => r.Role.ToString().ToLower()).ToList();

        var accessToken = _jwtTokenGenerator.GenerateAccessToken(user, roles);

        return new AuthResponse(
            new UserDto(user.Id, user.Email, user.FullName, user.AvatarUrl, roles),
            accessToken,
            newRefreshTokenString
        );
    }

    public async Task RevokeTokenAsync(string token, string? ipAddress, CancellationToken cancellationToken = default)
    {
        var tokens = await _refreshTokenRepository.FindAsync(t => t.Token == token, cancellationToken);
        var existingToken = tokens.FirstOrDefault();
        if (existingToken != null && existingToken.IsActive)
        {
            existingToken.IsRevoked = true;
            existingToken.RevokedByIp = ipAddress;
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<UserDto> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user == null)
        {
            throw new EntityNotFoundException(nameof(User), userId);
        }

        var userRoles = await _userRoleRepository.FindAsync(r => r.UserId == user.Id, cancellationToken);
        var roles = userRoles.Select(r => r.Role.ToString().ToLower()).ToList();

        return new UserDto(user.Id, user.Email, user.FullName, user.AvatarUrl, roles);
    }

    public async Task<UserDto> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user == null)
        {
            throw new EntityNotFoundException(nameof(User), userId);
        }

        if (!string.IsNullOrWhiteSpace(request.FullName))
        {
            user.FullName = request.FullName.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.Email) && request.Email.ToLower() != user.Email.ToLower())
        {
            var emailExists = await _userRepository.FindAsync(u => u.Email.ToLower() == request.Email.ToLower() && u.Id != userId, cancellationToken);
            if (emailExists.Any())
            {
                throw new DomainException("Email is already taken by another account.");
            }
            user.Email = request.Email.Trim().ToLower();
        }

        if (!string.IsNullOrWhiteSpace(request.NewPassword))
        {
            if (string.IsNullOrWhiteSpace(request.CurrentPassword) || !_passwordHasher.Verify(request.CurrentPassword, user.PasswordHash))
            {
                throw new DomainException("Current password is incorrect.");
            }
            user.PasswordHash = _passwordHasher.Hash(request.NewPassword);
        }

        await _userRepository.UpdateAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var userRoles = await _userRoleRepository.FindAsync(r => r.UserId == user.Id, cancellationToken);
        var roles = userRoles.Select(r => r.Role.ToString().ToLower()).ToList();

        return new UserDto(user.Id, user.Email, user.FullName, user.AvatarUrl, roles);
    }
}
