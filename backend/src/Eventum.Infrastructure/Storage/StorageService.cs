using Amazon.S3;
using Amazon.S3.Transfer;
using Eventum.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Eventum.Infrastructure.Storage;

public class StorageService : IStorageService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<StorageService> _logger;

    public StorageService(IConfiguration configuration, ILogger<StorageService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, string folder, CancellationToken cancellationToken = default)
    {
        var bucketName = _configuration["Storage:BucketName"] ?? "eventum-media";
        var publicBaseUrl = _configuration["Storage:PublicUrl"] ?? "https://pub-eventum.r2.dev";
        var key = $"{folder}/{Guid.NewGuid()}-{Path.GetFileName(fileName)}";

        var accessKey = _configuration["Storage:AccessKey"];
        var secretKey = _configuration["Storage:SecretKey"];
        var serviceUrl = _configuration["Storage:ServiceUrl"];

        if (!string.IsNullOrEmpty(accessKey) && !string.IsNullOrEmpty(secretKey) && !string.IsNullOrEmpty(serviceUrl))
        {
            try
            {
                var s3Config = new AmazonS3Config
                {
                    ServiceURL = serviceUrl,
                    ForcePathStyle = true
                };

                using var client = new AmazonS3Client(accessKey, secretKey, s3Config);
                var transferUtility = new TransferUtility(client);

                await transferUtility.UploadAsync(new TransferUtilityUploadRequest
                {
                    InputStream = fileStream,
                    Key = key,
                    BucketName = bucketName,
                    ContentType = contentType
                }, cancellationToken);

                return $"{publicBaseUrl.TrimEnd('/')}/{key}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload file to S3/R2 storage.");
                throw;
            }
        }

        // Local development fallback
        var localUploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", folder);
        Directory.CreateDirectory(localUploadsDir);
        var localFilePath = Path.Combine(localUploadsDir, Path.GetFileName(key));

        using var output = new FileStream(localFilePath, FileMode.Create);
        await fileStream.CopyToAsync(output, cancellationToken);

        var requestBase = _configuration["AppUrl"] ?? "http://localhost:5000";
        return $"{requestBase.TrimEnd('/')}/uploads/{folder}/{Path.GetFileName(key)}";
    }

    public Task<bool> DeleteFileAsync(string fileUrl, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Deleting file {FileUrl}", fileUrl);
        return Task.FromResult(true);
    }
}
