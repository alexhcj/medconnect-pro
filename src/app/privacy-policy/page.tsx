'use client'

import React, {useState} from 'react';
import {AlertTriangle, CheckCircle, Clock, Eye, FileText, Lock, Shield, Users} from 'lucide-react';
import {clsx} from 'clsx';

interface SecurityFeatureProps {
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	title: string;
	description: string;
}

interface CollapsibleSectionProps {
	id: string;
	title: string;
	children: React.ReactNode;
	defaultExpanded?: boolean;
}

const PrivacyPolicyPage = () => {
	const [activeSection, setActiveSection] = useState('overview');
	const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

	const toggleSection = (section: string) => {
		setExpandedSections(prev => ({
			...prev,
			[section]: !prev[section]
		}));
	};

	const sections = [
		{id: 'overview', title: 'Overview', icon: Shield},
		{id: 'collection', title: 'Information We Collect', icon: FileText},
		{id: 'usage', title: 'How We Use Information', icon: Users},
		{id: 'sharing', title: 'Information Sharing', icon: Eye},
		{id: 'security', title: 'Security Measures', icon: Lock},
		{id: 'rights', title: 'Your Rights', icon: CheckCircle},
		{id: 'hipaa', title: 'HIPAA Compliance', icon: AlertTriangle},
		{id: 'contact', title: 'Contact Information', icon: Users}
	];

	const SecurityFeature = ({icon: Icon, title, description}: SecurityFeatureProps) => (
		<div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
			<Icon className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0"/>
			<div>
				<h4 className="font-semibold text-blue-900">{title}</h4>
				<p className="text-sm text-blue-700 mt-1">{description}</p>
			</div>
		</div>
	);

	const CollapsibleSection = ({id, title, children, defaultExpanded = false}: CollapsibleSectionProps) => {
		const isExpanded = expandedSections[id] ?? defaultExpanded;

		return (
			<div className="border border-gray-200 rounded-lg mb-4">
				<button
					onClick={() => toggleSection(id)}
					className="w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 rounded-t-lg flex justify-between items-center"
				>
					<h3 className="text-lg font-semibold text-gray-900">{title}</h3>
					<span className={clsx("transform transition-transform", isExpanded ? "rotate-180" : "")}>
            ▼
          </span>
				</button>
				{isExpanded && (
					<div className="px-6 py-4 bg-white rounded-b-lg">
						{children}
					</div>
				)}
			</div>
		);
	};

	const renderContent = () => {
		switch (activeSection) {
			case 'overview':
				return (
					<div className="space-y-6">
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
							<div className="flex items-start space-x-3">
								<Shield className="h-8 w-8 text-blue-600 mt-1"/>
								<div>
									<h2 className="text-2xl font-bold text-blue-900 mb-2">Privacy Policy Overview</h2>
									<p className="text-blue-800 text-lg">
										Your privacy and the security of your health information is our top priority. This policy explains
										how we collect, use, and protect your personal and health information in compliance with HIPAA and
										other applicable privacy laws.
									</p>
								</div>
							</div>
						</div>

						<div className="grid md:grid-cols-2 gap-6">
							<div className="bg-white border border-gray-200 rounded-lg p-6">
								<h3 className="text-lg font-semibold text-gray-900 mb-3">Last Updated</h3>
								<p className="text-gray-600">January 29, 2025</p>
							</div>
							<div className="bg-white border border-gray-200 rounded-lg p-6">
								<h3 className="text-lg font-semibold text-gray-900 mb-3">Effective Date</h3>
								<p className="text-gray-600">January 29, 2025</p>
							</div>
						</div>

						<div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
							<div className="flex items-start space-x-3">
								<AlertTriangle className="h-6 w-6 text-amber-600 mt-1"/>
								<div>
									<h3 className="text-lg font-semibold text-amber-900 mb-2">Important Notice</h3>
									<p className="text-amber-800">
										This healthcare application is designed to handle Protected Health Information (PHI) in compliance
										with HIPAA regulations. By using our services, you acknowledge and consent to our privacy practices
										as outlined in this policy.
									</p>
								</div>
							</div>
						</div>
					</div>
				);

			case 'collection':
				return (
					<div className="space-y-6">
						<h2 className="text-2xl font-bold text-gray-900">Information We Collect</h2>

						<CollapsibleSection id="personal-info" title="Personal Information" defaultExpanded>
							<ul className="space-y-2 text-gray-700">
								<li>• Name, email address, and contact information</li>
								<li>• Professional credentials and license information</li>
								<li>• Practice or organization details</li>
								<li>• Account preferences and settings</li>
							</ul>
						</CollapsibleSection>

						<CollapsibleSection id="health-info" title="Protected Health Information (PHI)">
							<div className="space-y-4">
								<p className="text-gray-700">We may collect and process PHI including:</p>
								<ul className="space-y-2 text-gray-700">
									<li>• Patient medical records and clinical data</li>
									<li>• Treatment history and care plans</li>
									<li>• Diagnostic information and test results</li>
									<li>• Insurance and billing information</li>
									<li>• Any other health-related information entered into our system</li>
								</ul>
								<div className="bg-red-50 border border-red-200 rounded-lg p-4">
									<p className="text-red-800 font-semibold">
										All PHI is handled in strict accordance with HIPAA Privacy and Security Rules.
									</p>
								</div>
							</div>
						</CollapsibleSection>

						<CollapsibleSection id="technical-info" title="Technical Information">
							<ul className="space-y-2 text-gray-700">
								<li>• IP addresses and device information</li>
								<li>• Browser type and operating system</li>
								<li>• Usage patterns and application interactions</li>
								<li>• Security logs and access records</li>
								<li>• Performance and error reporting data</li>
							</ul>
						</CollapsibleSection>
					</div>
				);

			case 'usage':
				return (
					<div className="space-y-6">
						<h2 className="text-2xl font-bold text-gray-900">How We Use Your Information</h2>

						<div className="grid gap-6">
							<div className="bg-green-50 border border-green-200 rounded-lg p-6">
								<h3 className="text-lg font-semibold text-green-900 mb-3">Healthcare Operations</h3>
								<ul className="space-y-2 text-green-800">
									<li>• Providing healthcare services and support</li>
									<li>• Facilitating communication between healthcare providers</li>
									<li>• Maintaining medical records and care coordination</li>
									<li>• Quality assurance and improvement activities</li>
								</ul>
							</div>

							<div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
								<h3 className="text-lg font-semibold text-blue-900 mb-3">Service Delivery</h3>
								<ul className="space-y-2 text-blue-800">
									<li>• Account management and authentication</li>
									<li>• Technical support and troubleshooting</li>
									<li>• System maintenance and updates</li>
									<li>• Billing and payment processing</li>
								</ul>
							</div>

							<div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
								<h3 className="text-lg font-semibold text-purple-900 mb-3">Legal Compliance</h3>
								<ul className="space-y-2 text-purple-800">
									<li>• HIPAA compliance and reporting</li>
									<li>• Regulatory requirements and audits</li>
									<li>• Legal proceedings when required</li>
									<li>• Security incident response</li>
								</ul>
							</div>
						</div>
					</div>
				);

			case 'sharing':
				return (
					<div className="space-y-6">
						<h2 className="text-2xl font-bold text-gray-900">Information Sharing and Disclosure</h2>

						<div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
							<h3 className="text-lg font-semibold text-red-900 mb-2">General Policy</h3>
							<p className="text-red-800">
								We do not sell, rent, or trade your personal information or PHI. Information is only shared as outlined
								below and in accordance with applicable laws.
							</p>
						</div>

						<CollapsibleSection id="permitted-sharing" title="Permitted Disclosures" defaultExpanded>
							<div className="space-y-4">
								<div className="border-l-4 border-blue-500 pl-4">
									<h4 className="font-semibold text-gray-900">Healthcare Operations</h4>
									<p className="text-gray-700">With other healthcare providers involved in your care, as authorized by
										you or permitted by law.</p>
								</div>
								<div className="border-l-4 border-green-500 pl-4">
									<h4 className="font-semibold text-gray-900">Business Associates</h4>
									<p className="text-gray-700">With HIPAA-compliant service providers who assist in our operations
										(cloud hosting, IT support, etc.).</p>
								</div>
								<div className="border-l-4 border-orange-500 pl-4">
									<h4 className="font-semibold text-gray-900">Legal Requirements</h4>
									<p className="text-gray-700">When required by law, court orders, or regulatory authorities.</p>
								</div>
							</div>
						</CollapsibleSection>

						<CollapsibleSection id="consent-required" title="Consent-Based Sharing">
							<p className="text-gray-700 mb-4">
								The following disclosures require your explicit written consent:
							</p>
							<ul className="space-y-2 text-gray-700">
								<li>• Marketing communications</li>
								<li>• Research participation</li>
								<li>• Third-party analytics beyond operational needs</li>
								<li>• Any disclosure not covered by HIPAA permitted uses</li>
							</ul>
						</CollapsibleSection>
					</div>
				);

			case 'security':
				return (
					<div className="space-y-6">
						<h2 className="text-2xl font-bold text-gray-900">Security Measures</h2>

						<div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
							<h3 className="text-lg font-semibold text-green-900 mb-2">Our Commitment</h3>
							<p className="text-green-800">
								We implement comprehensive technical, administrative, and physical safeguards to protect your
								information in accordance with HIPAA Security Rule requirements.
							</p>
						</div>

						<div className="grid gap-4">
							<SecurityFeature
								icon={Lock}
								title="Encryption at Rest"
								description="AES-256 encryption for all stored data using PostgreSQL Transparent Data Encryption (TDE)"
							/>
							<SecurityFeature
								icon={Shield}
								title="Encryption in Transit"
								description="TLS 1.3 with certificate pinning for all data transmissions"
							/>
							<SecurityFeature
								icon={FileText}
								title="Database Security"
								description="Row-level security controls with comprehensive audit triggers"
							/>
							<SecurityFeature
								icon={Users}
								title="Access Controls"
								description="JWT token authentication with role-based access controls and rate limiting"
							/>
							<SecurityFeature
								icon={Eye}
								title="Network Security"
								description="Virtual Private Cloud (VPC) with private subnets and network isolation"
							/>
							<SecurityFeature
								icon={Clock}
								title="File Storage"
								description="AWS S3 with Server-Side Encryption using AWS Key Management Service (SSE-KMS)"
							/>
						</div>

						<div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
							<h3 className="text-lg font-semibold text-blue-900 mb-3">Additional Security Measures</h3>
							<ul className="space-y-2 text-blue-800">
								<li>• Regular security assessments and penetration testing</li>
								<li>• Employee security training and background checks</li>
								<li>• Incident response procedures and breach notification protocols</li>
								<li>• Multi-factor authentication for administrative access</li>
								<li>• Continuous monitoring and threat detection</li>
							</ul>
						</div>
					</div>
				);

			case 'rights':
				return (
					<div className="space-y-6">
						<h2 className="text-2xl font-bold text-gray-900">Your Privacy Rights</h2>

						<div className="grid gap-6">
							<div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
								<h3 className="text-lg font-semibold text-blue-900 mb-3">HIPAA Rights</h3>
								<ul className="space-y-2 text-blue-800">
									<li>• Right to access your PHI</li>
									<li>• Right to request amendments to your PHI</li>
									<li>• Right to request restrictions on use and disclosure</li>
									<li>• Right to request confidential communications</li>
									<li>• Right to an accounting of disclosures</li>
									<li>• Right to file a complaint</li>
								</ul>
							</div>

							<div className="bg-green-50 border border-green-200 rounded-lg p-6">
								<h3 className="text-lg font-semibold text-green-900 mb-3">Data Subject Rights</h3>
								<ul className="space-y-2 text-green-800">
									<li>• Right to data portability</li>
									<li>• Right to rectification of inaccurate data</li>
									<li>• Right to erasure (where legally permissible)</li>
									<li>• Right to restrict processing</li>
									<li>• Right to object to processing</li>
								</ul>
							</div>

							<div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
								<h3 className="text-lg font-semibold text-purple-900 mb-3">How to Exercise Your Rights</h3>
								<div className="space-y-4">
									<p className="text-purple-800">
										To exercise any of these rights, please contact our Privacy Officer using the information provided
										in the Contact section.
									</p>
									<div className="bg-white border border-purple-200 rounded p-4">
										<p className="text-sm text-purple-700">
											<strong>Response Time:</strong> We will respond to your request within 30 days, with possible
											extension of 60 additional days if needed.
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				);

			case 'hipaa':
				return (
					<div className="space-y-6">
						<h2 className="text-2xl font-bold text-gray-900">HIPAA Compliance</h2>

						<div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
							<div className="flex items-start space-x-3">
								<AlertTriangle className="h-8 w-8 text-red-600 mt-1"/>
								<div>
									<h3 className="text-xl font-semibold text-red-900 mb-2">HIPAA Notice</h3>
									<p className="text-red-800">
										This application serves as a Covered Entity under HIPAA. We are committed to protecting your health
										information and complying with all applicable HIPAA Privacy and Security Rules.
									</p>
								</div>
							</div>
						</div>

						<CollapsibleSection id="hipaa-compliance" title="Our HIPAA Obligations" defaultExpanded>
							<div className="space-y-4">
								<div className="grid md:grid-cols-2 gap-4">
									<div className="bg-white border border-gray-200 rounded-lg p-4">
										<h4 className="font-semibold text-gray-900 mb-2">Privacy Rule Compliance</h4>
										<ul className="text-sm text-gray-700 space-y-1">
											<li>• Minimum necessary standard</li>
											<li>• Individual rights protection</li>
											<li>• Administrative safeguards</li>
											<li>• Notice of privacy practices</li>
										</ul>
									</div>
									<div className="bg-white border border-gray-200 rounded-lg p-4">
										<h4 className="font-semibold text-gray-900 mb-2">Security Rule Compliance</h4>
										<ul className="text-sm text-gray-700 space-y-1">
											<li>• Technical safeguards</li>
											<li>• Physical safeguards</li>
											<li>• Administrative safeguards</li>
											<li>• Breach notification procedures</li>
										</ul>
									</div>
								</div>
							</div>
						</CollapsibleSection>

						<CollapsibleSection id="business-associates" title="Business Associate Agreements">
							<div className="space-y-4">
								<p className="text-gray-700">
									All third-party vendors who have access to PHI on our behalf have signed HIPAA-compliant Business
									Associate Agreements (BAAs). These include:
								</p>
								<ul className="space-y-2 text-gray-700">
									<li>• Cloud hosting providers (AWS)</li>
									<li>• IT support and maintenance services</li>
									<li>• Security monitoring services</li>
									<li>• Backup and disaster recovery providers</li>
								</ul>
							</div>
						</CollapsibleSection>

						<CollapsibleSection id="breach-notification" title="Breach Notification">
							<div className="space-y-4">
								<p className="text-gray-700">
									In the event of a breach of unsecured PHI, we will:
								</p>
								<ul className="space-y-2 text-gray-700">
									<li>• Notify affected individuals within 60 days</li>
									<li>• Report to the Department of Health and Human Services</li>
									<li>• Notify media if breach affects 500+ individuals in a state</li>
									<li>• Document the incident and remedial actions taken</li>
								</ul>
							</div>
						</CollapsibleSection>
					</div>
				);

			case 'contact':
				return (
					<div className="space-y-6">
						<h2 className="text-2xl font-bold text-gray-900">Contact Information</h2>

						<div className="grid md:grid-cols-2 gap-6">
							<div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
								<h3 className="text-lg font-semibold text-blue-900 mb-4">Privacy Officer</h3>
								<div className="space-y-3 text-blue-800">
									<div>
										<p className="font-medium">Email:</p>
										<p>privacy@healthcare-saas.com</p>
									</div>
									<div>
										<p className="font-medium">Phone:</p>
										<p>1-800-XXX-XXXX</p>
									</div>
									<div>
										<p className="font-medium">Mail:</p>
										<p>Privacy Officer<br/>Healthcare SaaS, Inc.<br/>123 Healthcare Ave<br/>Medical City, MC 12345</p>
									</div>
								</div>
							</div>

							<div className="bg-green-50 border border-green-200 rounded-lg p-6">
								<h3 className="text-lg font-semibold text-green-900 mb-4">Technical Support</h3>
								<div className="space-y-3 text-green-800">
									<div>
										<p className="font-medium">Email:</p>
										<p>support@healthcare-saas.com</p>
									</div>
									<div>
										<p className="font-medium">Phone:</p>
										<p>1-800-XXX-XXXX</p>
									</div>
									<div>
										<p className="font-medium">Hours:</p>
										<p>Monday - Friday: 8 AM - 8 PM EST<br/>Weekend: 9 AM - 5 PM EST</p>
									</div>
								</div>
							</div>
						</div>

						<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
							<h3 className="text-lg font-semibold text-yellow-900 mb-3">Filing Complaints</h3>
							<div className="space-y-4 text-yellow-800">
								<p>
									You have the right to file a complaint if you believe your privacy rights have been violated. You may
									file a complaint with:
								</p>
								<div className="grid md:grid-cols-2 gap-4">
									<div>
										<p className="font-medium">Our Privacy Officer (contact above)</p>
									</div>
									<div>
										<p className="font-medium">U.S. Department of Health and Human Services</p>
										<p className="text-sm">Office for Civil Rights<br/>
											Online: www.hhs.gov/ocr/privacy<br/>
											Phone: 1-800-368-1019</p>
									</div>
								</div>
								<p className="text-sm">
									<strong>No Retaliation:</strong> We will not retaliate against you for filing a complaint.
								</p>
							</div>
						</div>

						<div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
							<h3 className="text-lg font-semibold text-gray-900 mb-3">Policy Updates</h3>
							<p className="text-gray-700">
								We may update this privacy policy from time to time. We will notify you of any material changes by email
								and by posting the updated policy on our website. Continued use of our services after such changes
								constitutes acceptance of the updated policy.
							</p>
						</div>
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-white border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="py-6">
						<div className="flex items-center space-x-3">
							<Shield className="h-8 w-8 text-blue-600"/>
							<div>
								<h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
								<p className="text-gray-600 mt-1">Healthcare SaaS Platform - HIPAA Compliant</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="flex flex-col lg:flex-row gap-8">
					{/* Navigation Sidebar */}
					<div className="lg:w-1/4">
						<div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-4">
							<div className="p-4 border-b border-gray-200">
								<h2 className="font-semibold text-gray-900">Sections</h2>
							</div>
							<nav className="p-2">
								{sections.map((section) => {
									const Icon = section.icon;
									return (
										<button
											key={section.id}
											onClick={() => setActiveSection(section.id)}
											className={clsx(
												"w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-left transition-colors cursor-pointer",
												activeSection === section.id
													? "bg-blue-100 text-blue-700"
													: "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
											)}
										>
											<Icon className="h-5 w-5"/>
											<span>{section.title}</span>
										</button>
									);
								})}
							</nav>
						</div>
					</div>

					{/* Main Content */}
					<div className="lg:w-3/4">
						<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
							{renderContent()}
						</div>
					</div>
				</div>
			</div>

			{/* Footer */}
			<div className="bg-white border-t border-gray-200 mt-12">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
					<div className="flex items-center justify-between">
						<p className="text-sm text-gray-500">
							© 2025 Healthcare SaaS, Inc. All rights reserved.
						</p>
						<p className="text-sm text-gray-500">
							Last updated: January 29, 2025
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PrivacyPolicyPage;