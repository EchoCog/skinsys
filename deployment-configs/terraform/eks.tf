# EKS Cluster Configuration for Cognitive Cities Architecture

# IAM Role for EKS Cluster
resource "aws_iam_role" "cognitive_cities_cluster" {
  name = "${var.cluster_name}-cluster-role"

  assume_role_policy = jsonencode({
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
    }]
    Version = "2012-10-17"
  })
}

resource "aws_iam_role_policy_attachment" "cognitive_cities_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.cognitive_cities_cluster.name
}

# IAM Role for EKS Node Group
resource "aws_iam_role" "cognitive_cities_nodes" {
  name = "${var.cluster_name}-nodes-role"

  assume_role_policy = jsonencode({
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
    Version = "2012-10-17"
  })
}

resource "aws_iam_role_policy_attachment" "cognitive_cities_nodes_worker_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.cognitive_cities_nodes.name
}

resource "aws_iam_role_policy_attachment" "cognitive_cities_nodes_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.cognitive_cities_nodes.name
}

resource "aws_iam_role_policy_attachment" "cognitive_cities_nodes_registry_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.cognitive_cities_nodes.name
}

# EKS Cluster
resource "aws_eks_cluster" "cognitive_cities" {
  name     = var.cluster_name
  role_arn = aws_iam_role.cognitive_cities_cluster.arn
  version  = "1.28"

  vpc_config {
    subnet_ids              = concat(aws_subnet.cognitive_cities_public[*].id, aws_subnet.cognitive_cities_private[*].id)
    endpoint_private_access = true
    endpoint_public_access  = true
    security_group_ids      = [aws_security_group.cognitive_cities_cluster.id]
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  depends_on = [
    aws_iam_role_policy_attachment.cognitive_cities_cluster_policy,
  ]

  tags = {
    Name        = var.cluster_name
    Environment = var.environment
    Project     = "cognitive-cities"
  }
}

# EKS Node Groups for different triads
resource "aws_eks_node_group" "cerebral_triad" {
  cluster_name    = aws_eks_cluster.cognitive_cities.name
  node_group_name = "cerebral-triad"
  node_role_arn   = aws_iam_role.cognitive_cities_nodes.arn
  subnet_ids      = aws_subnet.cognitive_cities_private[*].id

  capacity_type  = "ON_DEMAND"
  instance_types = ["t3.medium"]

  scaling_config {
    desired_size = 2
    max_size     = 4
    min_size     = 1
  }

  update_config {
    max_unavailable = 1
  }

  labels = {
    triad = "cerebral"
    role  = "executive-functions"
  }

  depends_on = [
    aws_iam_role_policy_attachment.cognitive_cities_nodes_worker_policy,
    aws_iam_role_policy_attachment.cognitive_cities_nodes_cni_policy,
    aws_iam_role_policy_attachment.cognitive_cities_nodes_registry_policy,
  ]

  tags = {
    Name        = "${var.cluster_name}-cerebral-nodes"
    Environment = var.environment
    Triad       = "cerebral"
  }
}

resource "aws_eks_node_group" "somatic_triad" {
  cluster_name    = aws_eks_cluster.cognitive_cities.name
  node_group_name = "somatic-triad"
  node_role_arn   = aws_iam_role.cognitive_cities_nodes.arn
  subnet_ids      = aws_subnet.cognitive_cities_private[*].id

  capacity_type  = "ON_DEMAND"
  instance_types = ["t3.medium"]

  scaling_config {
    desired_size = 2
    max_size     = 4
    min_size     = 1
  }

  update_config {
    max_unavailable = 1
  }

  labels = {
    triad = "somatic"
    role  = "behavioral-control"
  }

  depends_on = [
    aws_iam_role_policy_attachment.cognitive_cities_nodes_worker_policy,
    aws_iam_role_policy_attachment.cognitive_cities_nodes_cni_policy,
    aws_iam_role_policy_attachment.cognitive_cities_nodes_registry_policy,
  ]

  tags = {
    Name        = "${var.cluster_name}-somatic-nodes"
    Environment = var.environment
    Triad       = "somatic"
  }
}

resource "aws_eks_node_group" "autonomic_triad" {
  cluster_name    = aws_eks_cluster.cognitive_cities.name
  node_group_name = "autonomic-triad"
  node_role_arn   = aws_iam_role.cognitive_cities_nodes.arn
  subnet_ids      = aws_subnet.cognitive_cities_private[*].id

  capacity_type  = "ON_DEMAND"
  instance_types = ["t3.medium"]

  scaling_config {
    desired_size = 2
    max_size     = 4
    min_size     = 1
  }

  update_config {
    max_unavailable = 1
  }

  labels = {
    triad = "autonomic"
    role  = "background-systems"
  }

  depends_on = [
    aws_iam_role_policy_attachment.cognitive_cities_nodes_worker_policy,
    aws_iam_role_policy_attachment.cognitive_cities_nodes_cni_policy,
    aws_iam_role_policy_attachment.cognitive_cities_nodes_registry_policy,
  ]

  tags = {
    Name        = "${var.cluster_name}-autonomic-nodes"
    Environment = var.environment
    Triad       = "autonomic"
  }
}

# CloudWatch Log Group for EKS
resource "aws_cloudwatch_log_group" "cognitive_cities" {
  name              = "/aws/eks/${var.cluster_name}/cluster"
  retention_in_days = 7

  tags = {
    Name        = "${var.cluster_name}-logs"
    Environment = var.environment
  }
}

# Outputs
output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = aws_eks_cluster.cognitive_cities.endpoint
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = aws_eks_cluster.cognitive_cities.vpc_config[0].cluster_security_group_id
}

output "cluster_name" {
  description = "Kubernetes Cluster Name"
  value       = aws_eks_cluster.cognitive_cities.name
}